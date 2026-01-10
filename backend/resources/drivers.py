# Driver expense routes and blueprint
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.driver import DriverExpense
from models.user import db

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')

@drivers_bp.route('/<driver_email>/expenses', methods=['GET'])
@jwt_required()
def get_driver_expenses(driver_email):
    user_id = get_jwt_identity()
    from models.user import User
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"msg": "Unauthorized"}), 403
    if current_user.email != driver_email and current_user.role.value != 'ceo':
        return jsonify({"msg": "Unauthorized"}), 403
    expenses = DriverExpense.query.filter_by(driver_email=driver_email).all()
    result = [
        {
            "id": e.id,
            "driver_email": e.driver_email,
            "amount": e.amount,
            "category": e.category,
            "type": e.type,
            "description": e.description,
            "date": e.date.isoformat() if e.date else None,
            "car_name": e.car_name,
            "car_number_plate": e.car_number_plate,
            "stock_name": e.stock_name
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
        type=data.get("type"),
        description=data.get("description"),
        date=date_obj,
        car_name=data.get("car_name"),
        car_number_plate=data.get("car_number_plate"),
        stock_name=data.get("stock_name")
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({
        "id": expense.id,
        "driver_email": expense.driver_email,
        "amount": expense.amount,
        "category": expense.category,
        "type": expense.type,
        "description": expense.description,
        "date": expense.date.isoformat() if expense.date else None,
        "car_name": expense.car_name,
        "car_number_plate": expense.car_number_plate,
        "stock_name": expense.stock_name
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
        expense.type = data.get("type", expense.type)
        expense.description = data.get("description", expense.description)
        expense.date = data.get("date", expense.date)
        expense.car_name = data.get("car_name", expense.car_name)
        expense.car_number_plate = data.get("car_number_plate", expense.car_number_plate)
        expense.stock_name = data.get("stock_name", expense.stock_name)
        db.session.commit()
        return jsonify({
            "id": expense.id,
            "driver_email": expense.driver_email,
            "amount": expense.amount,
            "category": expense.category,
            "type": expense.type,
            "description": expense.description,
            "date": expense.date.isoformat() if expense.date else None,
            "car_name": expense.car_name,
            "car_number_plate": expense.car_number_plate,
            "stock_name": expense.stock_name
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
