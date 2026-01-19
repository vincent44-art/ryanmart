from flask_restful import Resource, reqparse
from models.seller_fruit import SellerFruit
from models.user import User
from extensions import db
from flask import request
from datetime import datetime
from flask_jwt_extended import get_jwt_identity, jwt_required

class SellerFruitListResource(Resource):
    @jwt_required()
    def get(self):
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return {"message": "Authentication required"}, 401

        # Convert string ID back to int for SQLAlchemy query.get()
        if current_user_id is not None:
            try:
                current_user_id = int(current_user_id)
            except (TypeError, ValueError):
                pass

        # Get current user role
        user = User.query.get(current_user_id)
        if not user:
            return {"message": "User not found"}, 404

        # If CEO, return all seller fruits; otherwise, filter by user
        if getattr(user, 'role', None) == 'ceo':
            fruits = SellerFruit.query.all()
        else:
            fruits = SellerFruit.query.filter_by(created_by=current_user_id).all()
        return [fruit.to_dict() for fruit in fruits], 200

    @jwt_required()
    def delete(self):
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return {"message": "Authentication required"}, 401

        # Delete all fruits for the current user
        # Convert string ID back to int for SQLAlchemy query
        if current_user_id is not None:
            try:
                current_user_id = int(current_user_id)
            except (TypeError, ValueError):
                pass
        deleted_count = SellerFruit.query.filter_by(created_by=current_user_id).delete()
        db.session.commit()
        return {"message": f"Deleted {deleted_count} seller fruits successfully"}, 200

    @jwt_required()
    def post(self):
        data = request.get_json()

        # Log incoming data for debugging
        print(f"Received POST data: {data}")

        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return {"message": "Authentication required"}, 401

        # Convert string ID back to int for SQLAlchemy query
        if current_user_id is not None:
            try:
                current_user_id = int(current_user_id)
            except (TypeError, ValueError):
                pass

        user = User.query.get(current_user_id)
        if not user:
            return {"message": "User not found"}, 404

        # Extract fields
        stock_name = data.get('stock_name')
        fruit_name = data.get('fruit_name')
        qty = data.get('qty')
        unit_price = data.get('unit_price')
        date_str = data.get('date')
        amount = data.get('amount')
        customer_name = data.get('customer_name')

        # Check for missing fields
        missing_fields = []
        if not stock_name:
            missing_fields.append('stock_name')
        if not fruit_name:
            missing_fields.append('fruit_name')
        if qty is None:
            missing_fields.append('qty')
        if unit_price is None:
            missing_fields.append('unit_price')
        if not date_str:
            missing_fields.append('date')
        if amount is None:
            missing_fields.append('amount')

        # customer_name is optional, do not require
        if missing_fields:
            error_message = f"Missing required fields: {', '.join(missing_fields)}"
            print(error_message)
            return {"message": error_message}, 400

        # Validate numeric fields
        try:
            qty = float(qty)
            if qty <= 0:
                error_message = "Quantity must be a positive number"
                print(error_message)
                return {"message": error_message}, 400
        except (ValueError, TypeError):
            error_message = "Quantity must be a valid number"
            print(error_message)
            return {"message": error_message}, 400

        try:
            unit_price = float(unit_price)
            if unit_price <= 0:
                error_message = "Unit price must be a positive number"
                print(error_message)
                return {"message": error_message}, 400
        except (ValueError, TypeError):
            error_message = "Unit price must be a valid number"
            print(error_message)
            return {"message": error_message}, 400

        try:
            amount = float(amount)
            if amount <= 0:
                error_message = "Amount must be a positive number"
                print(error_message)
                return {"message": error_message}, 400
        except (ValueError, TypeError):
            error_message = "Amount must be a valid number"
            print(error_message)
            return {"message": error_message}, 400

        # Convert date string to date object
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            error_message = "Invalid date format. Use YYYY-MM-DD"
            print(error_message)
            return {"message": error_message}, 400

        new_fruit = SellerFruit(
            stock_name=stock_name,
            fruit_name=fruit_name,
            qty=qty,
            unit_price=unit_price,
            date=date,
            amount=amount,
            customer_name=customer_name,
            created_by=current_user_id
        )
        db.session.add(new_fruit)
        db.session.commit()
        return new_fruit.to_dict(), 201

class SellerFruitResource(Resource):
    def get(self, fruit_id):
        fruit = SellerFruit.query.get_or_404(fruit_id)
        return fruit.to_dict(), 200

    def put(self, fruit_id):
        fruit = SellerFruit.query.get_or_404(fruit_id)
        data = request.get_json()

        fruit.stock_name = data.get('stock_name', fruit.stock_name)
        fruit.fruit_name = data.get('fruit_name', fruit.fruit_name)
        fruit.qty = data.get('qty', fruit.qty)
        fruit.unit_price = data.get('unit_price', fruit.unit_price)
        fruit.amount = data.get('amount', fruit.amount)
        fruit.customer_name = data.get('customer_name', fruit.customer_name)

        # Handle date conversion if provided
        if 'date' in data:
            try:
                fruit.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400

        db.session.commit()
        return fruit.to_dict(), 200

    def delete(self, fruit_id):
        fruit = SellerFruit.query.get_or_404(fruit_id)
        db.session.delete(fruit)
        db.session.commit()
        return {"message": "Deleted successfully"}, 200
