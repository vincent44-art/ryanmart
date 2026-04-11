#!/usr/bin/env python3
"""
Create a test purchaser user for testing the purchases API.
Run: python backend/create_test_purchaser.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models.user import User, UserRole
from werkzeug.security import generate_password_hash

with app.app_context():
    # Create test purchaser
    email = 'purchaser@test.com'
    password = 'test123'
    name = 'Test Purchaser'
    
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"User {email} already exists.")
    else:
        user = User(
            email=email,
            name=name,
            role=UserRole.PURCHASER,  # Exact 'purchaser' role
            password_hash=generate_password_hash(password),
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        print(f"✅ Created test purchaser: {email}")
        print(f"Password: {password}")
        print(f"Role: {user.role.value}")
    
    # Verify role
    user = User.query.filter_by(email=email).first()
    print(f"User role: '{user.role.value}' (should be 'purchaser')")

