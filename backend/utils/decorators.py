from functools import wraps
from flask_jwt_extended import jwt_required
from flask import current_app, jsonify
from .helpers import get_current_user, make_response_data

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user = get_current_user()
            except Exception as e:
                current_app.logger.error(f"Error in role_required decorator get_current_user: {str(e)}")
                return make_response_data(
                    success=False,
                    message='Authentication failed.',
                    errors=['token_invalid'],
                    status_code=401
                )
            
            # Check if user is authenticated
            if not current_user:
                return make_response_data(
                    success=False,
                    message='Authentication required. Please log in.',
                    errors=['Not authenticated'],
                    status_code=401
                )
            
            # Safely get role value (handles both Enum and string roles)
            user_role = None
            try:
                if hasattr(current_user, 'role'):
                    if hasattr(current_user.role, 'value'):
                        user_role = current_user.role.value
                    else:
                        user_role = str(current_user.role)
            except Exception:
                user_role = None
            
            # Normalize to lowercase for case-insensitive comparison
            normalized_user_role = user_role.lower().strip() if user_role else None
            normalized_allowed = [role.lower().strip() for role in allowed_roles]
            
            if normalized_user_role not in normalized_allowed:
                current_app.logger.warning(
                    f"Role check failed: user_role='{user_role}' ({normalized_user_role}) "
                    f"not in allowed_roles={allowed_roles} ({normalized_allowed})"
                )
                return make_response_data(
                    success=False,
                    message='Access denied: Insufficient permissions.',
                    errors=[f'Your role ({user_role}) does not have access to this resource. Required one of: {allowed_roles}'],
                    status_code=403
                )
            current_app.logger.debug(f"Role check passed: {user_role}")
            return f(*args, **kwargs)
        return decorated_function
    return decorator
