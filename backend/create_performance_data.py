#!/usr/bin/env python3
"""
Script to create sample performance data for the dashboard
This will populate sales, purchases, and expense records
"""

import os
import sys
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from extensions import db
from models.user import User, UserRole
from models.inventory import Inventory
from models.sales import Sale
from models.purchases import Purchase
from models.driver import DriverExpense
from models.other_expense import OtherExpense

# Sample fruit types
FRUIT_TYPES = ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple', 'Grapes', 'Watermelon']
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

def create_sample_data():
    """Create sample data for performance dashboard"""
    
    # Create sample users if they don't exist
    ceo = User.query.filter_by(role=UserRole.CEO).first()
    if not ceo:
        ceo = User(
            name="CEO Admin",
            email="ceo@fruittrack.com",
            password="password123",
            role=UserRole.CEO,
            salary=50000
        )
        db.session.add(ceo)
    
    # Create sample inventory items
    for fruit in FRUIT_TYPES:
        inventory = Inventory.query.filter_by(fruit_type=fruit).first()
        if not inventory:
            inventory = Inventory(
                fruit_type=fruit,
                quantity=random.randint(100, 1000),
                price_per_unit=random.randint(50, 200),
                created_at=datetime.now()
            )
            db.session.add(inventory)
    
    # Create sample sales data for the last 6 months
    base_date = datetime.now()
    
    for month in range(6):
        month_date = base_date - timedelta(days=month * 30)
        
        for fruit in FRUIT_TYPES:
            # Create 3-5 sales per fruit per month
            for _ in range(random.randint(3, 5)):
                quantity = random.randint(10, 100)
                price_per_unit = random.randint(80, 200)
                revenue = quantity * price_per_unit
                
                sale = Sale(
                    fruit_type=fruit,
                    quantity=quantity,
                    price_per_unit=price_per_unit,
                    revenue=revenue,
                    sale_date=month_date - timedelta(days=random.randint(1, 30))
                )
                db.session.add(sale)
    
    # Create sample purchase data for the last 6 months
    for month in range(6):
        month_date = base_date - timedelta(days=month * 30)
        
        for fruit in FRUIT_TYPES:
            # Create 2-4 purchases per fruit per month
            for _ in range(random.randint(2, 4)):
                quantity = random.randint(20, 150)
                cost_per_unit = random.randint(40, 120)
                total_cost = quantity * cost_per_unit
                
                purchase = Purchase(
                    fruit_type=fruit,
                    quantity=quantity,
                    cost_per_unit=cost_per_unit,
                    total_cost=total_cost,
                    purchase_date=month_date - timedelta(days=random.randint(1, 30))
                )
                db.session.add(purchase)
    
    # Create sample expenses
    expense_categories = ['Transport', 'Utilities', 'Marketing', 'Maintenance', 'Insurance']
    
    for month in range(6):
        month_date = base_date - timedelta(days=month * 30)
        
        # Car expenses
        for _ in range(random.randint(2, 4)):
            driver_expense = DriverExpense(
                driver_name=f"Driver {random.randint(1, 5)}",
                amount=random.randint(500, 2000),
                description=random.choice(['Fuel', 'Maintenance', 'Tolls']),
                date=month_date - timedelta(days=random.randint(1, 30))
            )
            db.session.add(driver_expense)
        
        # Other expenses
        for _ in range(random.randint(3, 6)):
            other_expense = OtherExpense(
                category=random.choice(expense_categories),
                amount=random.randint(100, 1000),
                description=f"Monthly {random.choice(expense_categories)} expense",
                date=month_date - timedelta(days=random.randint(1, 30))
            )
            db.session.add(other_expense)
    
    try:
        db.session.commit()
        print("✅ Sample performance data created successfully!")
        print("📊 Dashboard will now display performance metrics")
        return True
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating sample data: {e}")
        return False

if __name__ == "__main__":
    # Import app context
    from app import app
    
    with app.app_context():
        create_sample_data()
