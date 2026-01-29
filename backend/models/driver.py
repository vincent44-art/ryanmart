
from flask_sqlalchemy import SQLAlchemy
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from datetime import datetime
from models.user import User

class DriverExpense(db.Model):
    __tablename__ = 'driver_expenses'
    id = db.Column(db.Integer, primary_key=True)
    driver_email = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(80), nullable=False)
    type = db.Column(db.String(80), nullable=True)
    description = db.Column(db.String(256), nullable=True)
    date = db.Column(db.Date, nullable=True)
    # New fields for enhanced car expense tracking
    car_number_plate = db.Column(db.String(20), nullable=True)
    car_name = db.Column(db.String(100), nullable=True)
    stock_name = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "driver_email": self.driver_email,
            "amount": self.amount,
            "category": self.category,
            "type": self.type,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "car_number_plate": self.car_number_plate,
            "car_name": self.car_name,
            "stock_name": self.stock_name
        }

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')

@drivers_bp.route('/<driver_email>/expenses', methods=['GET'])
@jwt_required()
def get_driver_expenses(driver_email):
    current_user_id = get_jwt_identity()
    # Convert string ID back to int for SQLAlchemy query.get()
    if current_user_id is not None:
        try:
            current_user_id = int(current_user_id)
        except (TypeError, ValueError):
            pass
    current_user = User.query.get(current_user_id)
    if not current_user or (current_user.email != driver_email and current_user.role.value != 'ceo'):
        return jsonify({"msg": "Unauthorized"}), 403

    expenses = DriverExpense.query.filter_by(driver_email=driver_email).all()
    result = [
        {
            "id": e.id,
            "driver_email": e.driver_email,
            "amount": e.amount,
            "category": e.category,
            "date": e.date.isoformat() if e.date else None
        } for e in expenses
    ]
    return jsonify(result), 200

@drivers_bp.route('/expenses', methods=['POST'])
@jwt_required()
def add_driver_expense():
    data = request.get_json()
    from datetime import datetime
    date_str = data.get("date")
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            date_obj = None
    expense = DriverExpense(
        driver_email=data.get("driver_email"),
        amount=data.get("amount"),
        category=data.get("category"),
        date=date_obj
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({
        "id": expense.id,
        "driver_email": expense.driver_email,
        "amount": expense.amount,
        "category": expense.category,
        "date": expense.date.isoformat() if expense.date else None
    }), 201

@drivers_bp.route('/expenses/<expense_id>', methods=['PATCH', 'DELETE'])
@jwt_required()
def handle_expense(expense_id):
    expense = DriverExpense.query.get(expense_id)
    if not expense:
        return jsonify({"msg": "Expense not found"}), 404
    if request.method == 'PATCH':
        data = request.get_json()
        expense.amount = data.get("amount", expense.amount)
        expense.category = data.get("category", expense.category)
        expense.date = data.get("date", expense.date)
        db.session.commit()
        return jsonify({
            "id": expense.id,
            "driver_email": expense.driver_email,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.date.isoformat() if expense.date else None
        }), 200
    elif request.method == 'DELETE':
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"msg": f"Expense {expense_id} deleted"}), 200

@drivers_bp.route('/<driver_email>/profile', methods=['GET', 'PATCH'])
@jwt_required()
def driver_profile(driver_email):
    if request.method == 'GET':
        # TODO: Get profile from DB
        profile = {
            "email": driver_email,
            "name": "John Doe",
            "role": "driver"
        }
        return jsonify(profile), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        # TODO: Update profile in DB
        updated_profile = {
            "email": driver_email,
            "name": data.get("name"),
            "phone": data.get("phone")
        }
        return jsonify(updated_profile), 200
