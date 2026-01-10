from flask_restful import Resource
from flask_jwt_extended import jwt_required
class SalaryPaymentsResource(Resource):
    @jwt_required()
    def get(self):
        salaries = Salary.query.order_by(Salary.date.desc()).all()
        return make_response_data(data=[s.to_dict() for s in salaries], message="Salary payments fetched successfully.")
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from extensions import db
from models.user import User
from ..models.salary import Salary
from ..utils.helpers import make_response_data, get_current_user
from datetime import datetime

class SalariesResource(Resource):
    @jwt_required()
    def delete(self):
        # Delete all salary records
        from ..models.salary import Salary, db
        db.session.query(Salary).delete()
        db.session.commit()
        return make_response_data(message="All salary records deleted.", status_code=200)
    @jwt_required()
    def get(self):
        salaries = Salary.query.order_by(Salary.date.desc()).all()
        return make_response_data(data=[s.to_dict() for s in salaries], message="Salary payment history fetched successfully.")

    @jwt_required()
    def post(self):
        from flask import request
        data = request.get_json()
        user_id = data.get('user_id')
        amount = data.get('amount')
        description = data.get('description')
        date_str = data.get('date')
        if not user_id or not amount or not date_str:
            return make_response_data(success=False, message="Missing required fields.", status_code=400)
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)
        salary = Salary(user_id=user_id, amount=amount, description=description, date=date)
        db.session.add(salary)
        db.session.commit()
        return make_response_data(data=salary.to_dict(), message="Salary record created", status_code=201)

class SalaryResource(Resource):
    @jwt_required()
    def delete(self, salary_id):
        salary = Salary.query.get_or_404(salary_id)
        db.session.delete(salary)
        db.session.commit()
        return make_response_data(message="Salary record deleted", status_code=204)

# New resource to toggle payment status
class SalaryPaymentToggleStatusResource(Resource):
    @jwt_required()
    def post(self, payment_id):
        salary = Salary.query.get_or_404(payment_id)
        salary.is_paid = not bool(salary.is_paid)
        db.session.commit()
        return make_response_data(data=salary.to_dict(), message="Salary payment status toggled.")