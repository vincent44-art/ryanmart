from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models.user import User

def make_response_data(data=None, success=True, message="", errors=None, status_code=200):
    """Return plain dict + status_code (not Flask Response) to support Flask-RESTful."""
    response = {
        "success": success,
        "message": message,
        "data": data or {},
        "errors": errors or []
    }
    return response, status_code

def get_current_user():
    """Get the current authenticated user from JWT identity."""
    user_id = get_jwt_identity()
    # Convert string ID back to int for SQLAlchemy query.get() which expects the PK type
    if user_id is not None:
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            pass
    return User.query.get(user_id)

