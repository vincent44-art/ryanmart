from functools import wraps
from flask_jwt_extended import jwt_required
from flask import jsonify
from .helpers import get_current_user, make_response_data

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            
            # Check if user is authenticated
            if not current_user:
                response_data, status_code = make_response_data(
                    success=False,
                    message='Authentication required. Please log in.',
                    errors=['Not authenticated'],
                    status_code=401
                )
                return jsonify(response_data), status_code
            
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
            
            if user_role not in allowed_roles:
                response_data, status_code = make_response_data(
                    success=False, 
                    message='Access denied: Insufficient permissions.', 
                    errors=[f'Your role ({user_role}) does not have access to this resource. Required: {allowed_roles}'],
                    status_code=403
                )
                return jsonify(response_data), status_code
            return f(*args, **kwargs)
        return decorated_function
    return decorator
