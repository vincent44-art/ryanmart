from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models.user import User
from extensions import db
import logging

logger = logging.getLogger('helpers')

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
    try:
        user_id = get_jwt_identity()
        
        # If no identity in token, return None
        if user_id is None:
            return None
        
        # Convert string ID back to int for SQLAlchemy query.get() which expects the PK type
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            logger.warning(f"Could not convert user_id to int: {user_id}")
            return None
        
        # Query the user from database
        user = User.query.get(user_id)
        return user
        
    except Exception as e:
        logger.error(f"Error in get_current_user(): {str(e)}")
        return None

