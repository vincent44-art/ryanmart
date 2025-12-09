from functools import wraps
from flask_jwt_extended import jwt_required
from .helpers import get_current_user, make_response_data

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user or current_user.role.value not in allowed_roles:
                return make_response_data(
                    success=False, 
                    message='Access denied: Insufficient permissions.', 
                    errors=['Your role does not have access to this resource.'],
                    status_code=403
                )
            return f(*args, **kwargs)
        return decorated_function
    return decorator