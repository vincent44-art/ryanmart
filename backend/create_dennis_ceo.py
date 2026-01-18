"""
Script to create a CEO user in the database on Render.
Email: dennisceo@ryanmart.com
Password: Dennis4431!
"""

from extensions import db
from models.user import User, UserRole
from app import create_app

app = create_app()
app.app_context().push()

def add_dennis_ceo():
    """Add Dennis as CEO user to the database."""
    ceo_email = "dennisceo@ryanmart.com"
    ceo_password = "Dennis4431!"
    
    # Check if user already exists
    existing = User.query.filter_by(email=ceo_email).first()
    if existing:
        print(f"User {ceo_email} already exists with ID: {existing.id}")
        print(f"Role: {existing.role}")
        print(f"Name: {existing.name}")
        print(f"Active: {existing.is_active}")
        # Update the password
        existing.set_password(ceo_password)
        existing.name = "Dennis"
        existing.role = UserRole.CEO
        db.session.commit()
        print(f"Updated password and details for existing user.")
    else:
        ceo = User(
            name="Dennis",
            email=ceo_email,
            role=UserRole.CEO,
            is_active=True,
            is_first_login=False  # Password is already set, no need to change on first login
        )
        ceo.set_password(ceo_password)
        db.session.add(ceo)
        db.session.commit()
        print(f"Added new CEO user: {ceo_email}")
        print(f"User ID: {ceo.id}")

if __name__ == "__main__":
    print("Creating Dennis CEO user...")
    add_dennis_ceo()
    print("Done!")

