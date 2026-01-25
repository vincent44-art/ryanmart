from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from flask import current_app, request
from models.user import User
from utils.helpers import make_response_data, get_current_user
from utils.it_monitor import log_login_success, log_login_failure

from flask import make_response
from datetime import timedelta
from extensions import db
import re


class LoginResource(Resource):
    def post(self):
        try:
            # Accept both JSON and form data
            if request.is_json:
                data = request.get_json()
                email = data.get('email')
                password = data.get('password')
            else:
                parser = reqparse.RequestParser()
                parser.add_argument('email', type=str, required=True)
                parser.add_argument('password', type=str, required=True)
                args = parser.parse_args()
                email = args['email']
                password = args['password']

            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                # Avoid AttributeError if role is None or not an Enum
                role_val = getattr(user.role, 'value', None) if user.role is not None else None
                # Convert user.id to string for JWT 'sub' claim (required by PyJWT >= 2.9.0)
                user_id_str = str(user.id)
                access_token = create_access_token(identity=user_id_str, additional_claims={"role": role_val})
                refresh_token = create_refresh_token(identity=user_id_str)
                log_login_success(user)
                return make_response_data(data={
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': user.to_dict()
                }, message="Login successful")

            log_login_failure(email)
            return make_response_data(success=False, message="Invalid credentials", status_code=401)
        except Exception as e:
            # Log full exception server-side for diagnostics and return a safe error
            current_app.logger.exception("Login error: %s", e)
            # Avoid leaking internals; return generic message
            return make_response_data(success=False, message="Internal server error", status_code=500)

class MeResource(Resource):
    @jwt_required()
    def get(self):
        try:
            user = get_current_user()
            if user:
                return make_response_data(data=user.to_dict(), message="Current user data fetched.")
            return make_response_data(success=False, message="User not found.", status_code=404)
        except Exception as e:
            # Log the error for debugging
            from flask import current_app
            current_app.logger.error(f"MeResource error: {str(e)}")
            return make_response_data(success=False, message="Failed to fetch user data", status_code=500)


class RefreshResource(Resource):
    def post(self):
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        if not refresh_token:
            return make_response_data(success=False, message="Refresh token required", status_code=400)

        try:
            # Decode the refresh token to get identity
            from flask_jwt_extended import decode_token
            decoded = decode_token(refresh_token, allow_expired=False)
            identity = decoded['sub']
            access_token = create_access_token(identity=identity)
            return make_response_data(data={'access_token': access_token}, message="Token refreshed successfully")
        except Exception as e:
            return make_response_data(success=False, message="Invalid refresh token", status_code=401)


class ChangePasswordResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json() or {}
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return make_response_data(success=False, message="All password fields are required", status_code=400)

        if new_password != confirm_password:
            return make_response_data(success=False, message="New passwords do not match", status_code=400)

        # Enforce strong password: min 8, uppercase, lowercase, number
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$'

        if not re.match(pattern, new_password):
            return make_response_data(
                success=False,
                message="Password must be at least 8 characters and include uppercase, lowercase, and a number",
                status_code=400
            )

        user = get_current_user()
        if not user or not user.check_password(current_password):
            return make_response_data(success=False, message="Current password is incorrect", status_code=400)

        user.set_password(new_password)
        user.is_first_login = False  # Mark as not first login after password change
        db.session.commit()

        return make_response_data(message="Password changed successfully")
