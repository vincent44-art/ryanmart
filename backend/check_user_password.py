"""
Script to check the user password in the database.
Connects to the Render PostgreSQL database and queries the user.
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from extensions import db
from models.user import User
from app import create_app

# Get DATABASE_URL from environment
database_url = os.environ.get('DATABASE_URL', '')
if not database_url:
    print("ERROR: DATABASE_URL environment variable not set!")
    print("Please set it or run this script on Render.")
    sys.exit(1)

app = create_app()
app.config['SQLALCHEMY_DATABASE_URI'] = database_url

def check_user_password():
    """Check the password for dennisceo@ryanmart.com in the database."""
    email = "dennisceo@ryanmart.com"
    
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        
        if user:
            print(f"\n=== User Details for {email} ===")
            print(f"ID: {user.id}")
            print(f"Name: {user.name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Is Active: {user.is_active}")
            print(f"Is First Login: {user.is_first_login}")
            print(f"Password Hash: {user.password_hash[:50]}..." if user.password_hash else "Password Hash: None")
            print("================================\n")
            
            # Test if the known password matches
            test_password = "Dennis4431!"
            if user.check_password(test_password):
                print(f"✅ Password '{test_password}' MATCHES the stored hash!")
            else:
                print(f"❌ Password '{test_password}' DOES NOT MATCH the stored hash")
                print("\nNote: The actual password hash is stored in the database.")
                print("We cannot retrieve the original password, only verify if a given password matches.")
        else:
            print(f"❌ User with email {email} not found in the database!")
            print("\nAvailable users in the database:")
            all_users = User.query.all()
            for u in all_users:
                print(f"  - {u.email} (ID: {u.id}, Role: {u.role})")

if __name__ == "__main__":
    print("Checking user password in database...")
    print(f"Database URL: {database_url[:50]}..." if len(database_url) > 50 else f"Database URL: {database_url}")
    check_user_password()

