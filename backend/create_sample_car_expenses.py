#!/usr/bin/env python3
"""
Create sample car expenses data for testing /api/car-expenses endpoint.
"""

from app import app
from models.driver import DriverExpense
from extensions import db
from datetime import date, timedelta
import sys

def create_sample_data():
    with app.app_context():
        # Sample drivers from users table (assumes drivers exist)
        drivers = ['driver1@ryanmart.com', 'driver2
