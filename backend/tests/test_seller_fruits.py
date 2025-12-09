import unittest
from backend.app import create_app
from backend.extensions import db
from backend.models.seller_fruit import SellerFruit
from datetime import datetime

class SellerFruitsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_seller_fruit(self):
        data = {
            'stock_name': 'TestStock',
            'fruit_name': 'Apple',
            'qty': 10.5,
            'unit_price': 50.0,
            'date': '2023-10-01',
            'amount': 525.0
        }
        response = self.client.post('/api/seller-fruits', json=data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('fruit_name', response.get_json())
        self.assertEqual(response.get_json()['fruit_name'], 'Apple')

    def test_get_seller_fruits(self):
        # Create a test fruit
        fruit = SellerFruit(
            stock_name='TestStock',
            fruit_name='Banana',
            qty=5.0,
            unit_price=30.0,
            date=datetime.strptime('2023-10-02', '%Y-%m-%d').date(),
            amount=150.0
        )
        with self.app.app_context():
            db.session.add(fruit)
            db.session.commit()

        response = self.client.get('/api/seller-fruits')
        self.assertEqual(response.status_code, 200)
        fruits = response.get_json()
        self.assertEqual(len(fruits), 1)
        self.assertEqual(fruits[0]['fruit_name'], 'Banana')

    def test_update_seller_fruit(self):
        # Create a test fruit
        fruit = SellerFruit(
            stock_name='TestStock',
            fruit_name='Orange',
            qty=8.0,
            unit_price=40.0,
            date=datetime.strptime('2023-10-03', '%Y-%m-%d').date(),
            amount=320.0
        )
        with self.app.app_context():
            db.session.add(fruit)
            db.session.commit()
            fruit_id = fruit.id

        update_data = {
            'stock_name': 'TestStock',
            'fruit_name': 'Orange Updated',
            'qty': 10.0,
            'unit_price': 45.0,
            'date': '2023-10-04',
            'amount': 450.0
        }
        response = self.client.put(f'/api/seller-fruits/{fruit_id}', json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_fruit = response.get_json()
        self.assertEqual(updated_fruit['fruit_name'], 'Orange Updated')

    def test_delete_seller_fruit(self):
        # Create a test fruit
        fruit = SellerFruit(
            stock_name='TestStock',
            fruit_name='Grape',
            qty=12.0,
            unit_price=60.0,
            date=datetime.strptime('2023-10-05', '%Y-%m-%d').date(),
            amount=720.0
        )
        with self.app.app_context():
            db.session.add(fruit)
            db.session.commit()
            fruit_id = fruit.id

        response = self.client.delete(f'/api/seller-fruits/{fruit_id}')
        self.assertEqual(response.status_code, 200)

        # Verify deletion
        response = self.client.get('/api/seller-fruits')
        fruits = response.get_json()
        self.assertEqual(len(fruits), 0)

if __name__ == '__main__':
    unittest.main()
