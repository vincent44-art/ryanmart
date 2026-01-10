from flask_restful import Resource
from models.seller_fruit import SellerFruit
from extensions import db
from flask import request

class SellerFruitBulkResource(Resource):
    def post(self):
        data = request.get_json()
        items = data.get('items', [])

        if not items:
            return {"message": "No items provided"}, 400

        created_fruits = []
        for item in items:
            fruit_name = item.get('fruit_name')
            qty = item.get('qty')
            unit_price = item.get('unit_price')
            date = item.get('date')
            amount = item.get('amount')

            if not all([fruit_name, qty, unit_price, date, amount]):
                return {"message": f"Missing required fields for item: {item}"}, 400

            new_fruit = SellerFruit(
                fruit_name=fruit_name,
                qty=qty,
                unit_price=unit_price,
                date=date,
                amount=amount
            )
            db.session.add(new_fruit)
            created_fruits.append(new_fruit)

        db.session.commit()
        return [fruit.to_dict() for fruit in created_fruits], 201
