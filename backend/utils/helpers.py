from flask_jwt_extended import get_jwt_identity
from ..models.user import User

def make_response_data(data=None, success=True, message="", errors=None, status_code=200):
    """Return plain dict + status_code (not Flask Response) to support Flask-RESTful."""
    response = {
        "success": success,
        "message": message,
        "data": data or {},
        "errors": errors or []
    }
    return response, status_code  # ✅ NO jsonify()

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)
