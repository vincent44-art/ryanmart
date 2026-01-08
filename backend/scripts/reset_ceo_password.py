import os
import sys
from werkzeug.security import generate_password_hash

# Ensure project root is on sys.path so `backend` package can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now import the Flask app, db, and User model from the backend package
from backend.app import app
from backend.extensions import db
from backend.models.user import User


def reset_password(email: str, new_password: str) -> None:
    """
    Reset the password for a user identified by email, inside the Flask app context.
    """
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            raise SystemExit(f"User with email '{email}' not found.")

        # Update with hashed password
        user.password_hash = generate_password_hash(new_password)
        db.session.add(user)
        db.session.commit()

        # Print success message with email and new password
        print(f"Password reset successful for user '{email}'. New password: 'password123'")


if __name__ == "__main__":
    target_email = "ceo@ryanmart.com"
    new_password = "password123"
    reset_password(target_email, new_password)
