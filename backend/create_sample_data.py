#!/usr/bin/env python3
"""
Sample data creation script for the fruit tracking system.
This script creates realistic sample data to populate the PerformanceOverview dashboard.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app import app, db
from models.user import User, UserRole
from models.sales import Sale
from models.purchases import Purchase
from models.inventory import Inventory
from models.driver import DriverExpense
from models.other_expense import OtherExpense
from models.gradient import Gradient

def create_sample_data():
    """Create comprehensive sample data for the dashboard."""
    
    with app.app_context():
        print("🍎 Creating sample data for PerformanceOverview dashboard...")
        
        # Clear existing sample data
        Sale.query.delete()
        Purchase.query.delete()
        Inventory.query.delete()
        DriverExpense.query.delete()
        OtherExpense.query.delete()
        Gradient.query.delete()
        db.session.commit()
        
        # Create users if they don't exist
        ceo = User.query.filter_by(email='ceo@fruittrack.com').first()
        if not ceo:
            ceo = User(
                email='ceo@fruittrack.com',
                name='CEO User',
                role=UserRole.CEO,
                salary=150000.00
            )
            ceo.set_password('password123')
            db.session.add(ceo)
        
        seller = User.query.filter_by(email='seller@fruittrack.com').first()
        if not seller:
            seller = User(
                email='seller@fruittrack.com',
                name='John Seller',
                role=UserRole.SELLER,
                salary=80000.00
            )
            seller.set_password('password123')
            db.session.add(seller)
        
        purchaser = User.query.filter_by(email='purchaser@fruittrack.com').first()
        if not purchaser:
            purchaser = User(
                email='purchaser@fruittrack.com',
                name='Jane Purchaser',
                role=UserRole.PURCHASER,
                salary=75000.00
            )
            purchaser.set_password('password123')
            db.session.add(purchaser)
        
        db.session.commit()
        
        # Sample fruit types
        fruit_types = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Pineapples', 'Grapes']
        
        # Create sample inventory
        for fruit in fruit_types:
            inventory = Inventory(
                name=f"{fruit} Inventory",
                fruit_type=fruit,
                quantity=str(100 + (hash(fruit) % 200)),
                unit='kg',
                location='Main Warehouse',
                purchase_price=50 + (hash(fruit) % 100),
                added_by=ceo.id
            )
            db.session.add(inventory)
        
        # Create sample purchases for the last 6 months
        base_date = datetime.now()
        
        for month_offset in range(6):
            month_date = base_date - timedelta(days=30 * month_offset)
            
            for fruit in fruit_types:
                # Create 2-3 purchases per fruit per month
                for i in range(2 + (hash(fruit + str(month_offset)) % 2)):
                    quantity = 50 + (hash(fruit + str(i)) % 100)
                    cost_per_unit = 30 + (hash(fruit + str(i)) % 70)

                    purchase = Purchase(
                        purchaser_id=purchaser.id,
                        employee_name=f'Employee {i+1}',
                        fruit_type=fruit,
                        quantity=str(quantity),  # Store as string as per model
                        unit='kg',
                        buyer_name=f'Buyer {i+1}',
                        cost=quantity * cost_per_unit,
                        purchase_date=month_date - timedelta(days=hash(fruit) % 15),
                        amount_per_kg=cost_per_unit
                    )
                    db.session.add(purchase)
        
        # Create sample sales for the last 6 months
        for month_offset in range(6):
            month_date = base_date - timedelta(days=30 * month_offset)
            
            for fruit in fruit_types:
                # Create 3-5 sales per fruit per month
                for i in range(3 + (hash(fruit + str(month_offset)) % 3)):
                    quantity = 20 + (hash(fruit + str(i)) % 80)
                    price_per_unit = 50 + (hash(fruit + str(i)) % 100)
                    
                    sale = Sale(
                        stock_name=fruit,
                        fruit_name=fruit,
                        qty=quantity,
                        unit_price=price_per_unit,
                        amount=quantity * price_per_unit,
                        date=month_date - timedelta(days=hash(fruit) % 20),
                        seller_id=seller.id
                    )
                    db.session.add(sale)
        
        # Create sample driver expenses
        driver_expenses = [
            ('Fuel', 15000, base_date - timedelta(days=10)),
            ('Maintenance', 8000, base_date - timedelta(days=25)),
            ('Insurance', 5000, base_date - timedelta(days=45)),
            ('Fuel', 12000, base_date - timedelta(days=60)),
            ('Maintenance', 6000, base_date - timedelta(days=75)),
        ]
        
        for description, amount, date in driver_expenses:
            expense = DriverExpense(
                description=description,
                amount=amount,
                date=date
            )
            db.session.add(expense)
        
        # Create sample other expenses
        other_expenses = [
            ('Office Rent', 30000, base_date - timedelta(days=5)),
            ('Utilities', 5000, base_date - timedelta(days=15)),
            ('Marketing', 8000, base_date - timedelta(days=30)),
            ('Office Supplies', 3000, base_date - timedelta(days=45)),
            ('Internet', 2000, base_date - timedelta(days=60)),
        ]
        
        for description, amount, date in other_expenses:
            expense = OtherExpense(
                description=description,
                amount=amount,
                date=date
            )
            db.session.add(expense)
        
        # Create sample gradients
        gradients = [
            Gradient(
                fruit_type='Apples',
                gradient_type='Grade A',
                name='Apples Grade A',
                application_date=datetime.utcnow().date(),
                description='High quality apples',
                quantity='100',
                unit='kg',
                purpose='Quality grading'
            ),
            Gradient(
                fruit_type='Apples',
                gradient_type='Grade B',
                name='Apples Grade B',
                application_date=datetime.utcnow().date(),
                description='Medium quality apples',
                quantity='80',
                unit='kg',
                purpose='Quality grading'
            ),
            Gradient(
                fruit_type='Bananas',
                gradient_type='Grade A',
                name='Bananas Grade A',
                application_date=datetime.utcnow().date(),
                description='High quality bananas',
                quantity='120',
                unit='kg',
                purpose='Quality grading'
            ),
            Gradient(
                fruit_type='Bananas',
                gradient_type='Grade B',
                name='Bananas Grade B',
                application_date=datetime.utcnow().date(),
                description='Medium quality bananas',
                quantity='90',
                unit='kg',
                purpose='Quality grading'
            ),
            Gradient(
                fruit_type='Oranges',
                gradient_type='Grade A',
                name='Oranges Grade A',
                application_date=datetime.utcnow().date(),
                description='High quality oranges',
                quantity='110',
                unit='kg',
                purpose='Quality grading'
            ),
            Gradient(
                fruit_type='Oranges',
                gradient_type='Grade B',
                name='Oranges Grade B',
                application_date=datetime.utcnow().date(),
                description='Medium quality oranges',
                quantity='85',
                unit='kg',
                purpose='Quality grading'
            ),
        ]
        
        for gradient in gradients:
            db.session.add(gradient)
        
        db.session.commit()
        
        # Print summary
        print("✅ Sample data created successfully!")
        print(f"   Users: {User.query.count()}")
        print(f"   Sales: {Sale.query.count()}")
        print(f"   Purchases: {Purchase.query.count()}")
        print(f"   Inventory: {Inventory.query.count()}")
        print(f"   Driver Expenses: {DriverExpense.query.count()}")
        print(f"   Other Expenses: {OtherExpense.query.count()}")
        print(f"   Gradients: {Gradient.query.count()}")
        
        # Calculate and display totals
        total_sales = sum(sale.revenue for sale in Sale.query.all())
        total_purchases = sum(purchase.cost for purchase in Purchase.query.all())
        total_driver_expenses = sum(expense.amount for expense in DriverExpense.query.all())
        total_other_expenses = sum(expense.amount for expense in OtherExpense.query.all())
        total_salaries = sum(user.salary for user in User.query.all())
        
        print("\n📊 Financial Summary:")
        print(f"   Total Sales Revenue: KES {total_sales:,.2f}")
        print(f"   Total Purchase Costs: KES {total_purchases:,.2f}")
        print(f"   Total Driver Expenses: KES {total_driver_expenses:,.2f}")
        print(f"   Total Other Expenses: KES {total_other_expenses:,.2f}")
        print(f"   Total Salaries: KES {total_salaries:,.2f}")
        print(f"   Net Profit: KES {(total_sales - total_purchases - total_driver_expenses - total_other_expenses - total_salaries):,.2f}")

if __name__ == "__main__":
    create_sample_data()
