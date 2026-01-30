from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from models.user import User
from extensions import db
import logging

logger = logging.getLogger('helpers')

def make_response_data(data=None, success=True, message="", errors=None, status_code=200):
    """
    Return a Flask Response object with proper JSON serialization.
    
    This function ensures consistent JSON responses across all API endpoints,
    preventing "empty response" errors that can occur when plain dicts are
    not properly serialized in edge cases (CORS middleware, exception handlers, etc.)
    
    Args:
        data: The data payload to return (will be wrapped in the standard response format)
        success: Boolean indicating if the request was successful
        message: A status message to include in the response
        errors: A list of error messages (if any)
        status_code: The HTTP status code to return
        
    Returns:
        Flask Response object with proper JSON Content-Type header
    """
    response_payload = {
        "success": success,
        "message": message,
        "data": data or {},
        "errors": errors or []
    }
    
    # Log the response for debugging
    try:
        logger.debug(f"make_response_data: status_code={status_code}, success={success}, message={message}")
    except Exception:
        pass
    
    # Return just the Response object with status code set directly on it.
    # This prevents Flask-RESTful from trying to serialize the Response as JSON data.
    resp = jsonify(response_payload)
    resp.status_code = status_code
    return resp

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

