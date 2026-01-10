from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required
from flask import request, send_file
import io
from extensions import db
from models.other_expense import OtherExpense
from models.driver import DriverExpense
from utils.helpers import make_response_data, get_current_user
from utils.pdf_generator import DriverExpensePDFGenerator
from datetime import datetime

class OtherExpensesResource(Resource):
    @jwt_required()
    def get(self):
        expenses = OtherExpense.query.order_by(OtherExpense.date.desc()).all()
        return make_response_data(data=[e.to_dict() for e in expenses], message="Other expenses fetched successfully.")

class CarExpensesResource(Resource):
    @jwt_required()
    def get(self):
        expenses = DriverExpense.query.order_by(DriverExpense.date.desc()).all()
        return make_response_data(data=[e.to_dict() for e in expenses], message="Car expenses fetched successfully.")

    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user = get_current_user()
        # Validate amount
        amount = data.get('amount')
        if amount is None or amount == '' or not isinstance(amount, (int, float)):
            try:
                amount = float(amount)
            except (TypeError, ValueError):
                return make_response_data(success=False, message="Amount is required and must be a valid number.", status_code=400)
        try:
            expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format for date. Use YYYY-MM-DD.", status_code=400)
        expense = DriverExpense(
            driver_email=current_user.email,
            amount=amount,
            category=data.get('category'),
            type=data.get('type'),
            description=data.get('description'),
            date=expense_date,
            # New fields for enhanced car expense tracking
            car_number_plate=data.get('car_number_plate'),
            car_name=data.get('car_name'),
            stock_name=data.get('stock_name')
        )
        db.session.add(expense)
        db.session.commit()
        return make_response_data(data={
            "id": expense.id,
            "driver_email": expense.driver_email,
            "amount": expense.amount,
            "category": expense.category,
            "type": expense.type,
            "description": expense.description,
            "date": expense.date.isoformat() if expense.date else None,
            "car_number_plate": expense.car_number_plate,
            "car_name": expense.car_name,
            "stock_name": expense.stock_name
        }, message="Car expense created", status_code=201)

    @jwt_required()
    def delete(self, expense_id):
        expense = DriverExpense.query.get(expense_id)
        if not expense:
            return make_response_data(success=False, message="Car expense not found.", status_code=404)
        db.session.delete(expense)
        db.session.commit()
        return make_response_data(data=None, message="Car expense deleted successfully.", status_code=200)

class DriverExpenseReportResource(Resource):
    @jwt_required()
    def get(self, driver_email):
        current_user = get_current_user()
        if current_user.email != driver_email and current_user.role != 'ceo':
            return make_response_data(success=False, message="Unauthorized", status_code=403)

        # Get query parameters
        report_type = request.args.get('type', 'daily')  # daily or monthly
        date = request.args.get('date')  # YYYY-MM-DD for daily, YYYY-MM for monthly
        year = request.args.get('year')
        month = request.args.get('month')

        # Fetch all expenses for the driver
        expenses = DriverExpense.query.filter_by(driver_email=driver_email).all()
        expense_data = [e.to_dict() for e in expenses]

        pdf_generator = DriverExpensePDFGenerator()

        try:
            if report_type == 'daily':
                if not date:
                    from datetime import date as today_date
                    report_date = today_date.today()
                else:
                    report_date = datetime.strptime(date, '%Y-%m-%d').date()

                pdf_content = pdf_generator.generate_daily_report(expense_data, driver_email, report_date)

                # Create a BytesIO object for the response
                pdf_buffer = io.BytesIO(pdf_content)

                # Generate filename
                filename = f"driver_expense_report_{driver_email}_{report_date.strftime('%Y%m%d')}.pdf"

                return send_file(
                    pdf_buffer,
                    as_attachment=True,
                    download_name=filename,
                    mimetype='application/pdf'
                )

            elif report_type == 'monthly':
                if not year or not month:
                    return make_response_data(success=False, message="Year and month are required for monthly reports", status_code=400)

                try:
                    year_int = int(year)
                    month_int = int(month)
                    if month_int < 1 or month_int > 12:
                        return make_response_data(success=False, message="Invalid month (1-12)", status_code=400)
                except ValueError:
                    return make_response_data(success=False, message="Invalid year or month format", status_code=400)

                pdf_content = pdf_generator.generate_monthly_report(expense_data, driver_email, year_int, month_int)

                # Create a BytesIO object for the response
                pdf_buffer = io.BytesIO(pdf_content)

                # Generate filename
                filename = f"driver_expense_report_{driver_email}_{year}_{month:02d}.pdf"

                return send_file(
                    pdf_buffer,
                    as_attachment=True,
                    download_name=filename,
                    mimetype='application/pdf'
                )
            else:
                return make_response_data(success=False, message="Invalid report type. Use 'daily' or 'monthly'", status_code=400)

        except Exception as e:
            return make_response_data(success=False, message=f"Error generating report: {str(e)}", status_code=500)
