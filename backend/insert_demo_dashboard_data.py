import random
from datetime import datetime, timedelta
from app import create_app, db
from models.sales import Sale
from models.purchases import Purchase
from models.user import User
from models.other_expense import OtherExpense
from models.driver import DriverExpense

app = create_app()

FRUITS = ['Orange', 'Apple', 'Banana', 'Mango', 'Pineapple', 'Watermelon']

with app.app_context():
    # Add demo CEO if not exists
    ceo = User.query.filter_by(role='CEO').first()
    if not ceo:
        ceo = User(name='Demo CEO', email='ceo@example.com', role='CEO', salary=500)
        ceo.set_password('password')  # Set default password
        db.session.add(ceo)
        db.session.commit()
    elif not ceo.password_hash:
        ceo.set_password('password')
        db.session.commit()

    # Add demo sales, purchases, car expenses, other expenses for each month and fruit
    year = datetime.now().year
    for month in range(1, 13):
        for fruit in FRUITS:
            # Purchases
            purchase_date = datetime(year, month, random.randint(1, 28))
            purchase = Purchase(fruit_type=fruit, cost=random.randint(1000, 3000), purchase_date=purchase_date, purchaser_id=ceo.id, employee_name='Demo Employee', quantity=random.randint(10, 100), unit='kg', buyer_name='Demo Buyer')
            db.session.add(purchase)
            # Sales
            sale_date = purchase_date + timedelta(days=random.randint(1, 5))
            sale = Sale(fruit_type=fruit, revenue=random.randint(2000, 5000), sale_date=sale_date, seller_id=ceo.id, quantity=random.randint(5, 50))
            db.session.add(sale)
        # Car expense (add a demo driver email)
        car_exp = DriverExpense(driver_email='driver@example.com', amount=random.randint(500, 1500), category='Fuel', date=datetime(year, month, random.randint(1, 28)))
        db.session.add(car_exp)
        # Other expense (assign to CEO)
        other_exp = OtherExpense(expense_type='Misc', amount=random.randint(300, 1200), date=datetime(year, month, random.randint(1, 28)), user_id=ceo.id)
        db.session.add(other_exp)
    db.session.commit()
    print('Demo dashboard data inserted.')
