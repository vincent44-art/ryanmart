from flask_restful import Resource
from flask_jwt_extended import jwt_required
from flask import request, send_file
import io
import logging
import re
from extensions import db
from models.other_expense import OtherExpense
from models.driver import DriverExpense
from utils.helpers import make_response_data, get_current_user
from utils.pdf_generator import DriverExpensePDFGenerator
from sqlalchemy import text
from datetime import datetime

class OtherExpensesResource(Resource):
    @jwt_required()
    def get(self):
        expenses = OtherExpense.query.order_by(OtherExpense.date.desc()).all()
        return make_response_data(data=[e.to_dict() for e in expenses], message="Other expenses fetched successfully.")

class CarExpensesResource(Resource):
    @jwt_required()
    def get(self, expense_id=None):
        logger = logging.getLogger('car_expenses')
        logger.info(f"Fetching car expenses (ID: {expense_id})")
        
        def safe_float(value, default=0.0):
            """Safely convert a value to float, handling strings and None"""
            if value is None:
                return default
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                try:
                    match = re.search(r'(\d+(\.\d+)?)', value)
                    return float(match.group(1)) if match else default
                except (ValueError, TypeError):
                    return default
            return default
        
        try:
            if expense_id:
                expense = DriverExpense.query.get(expense_id)
                if not expense:
                    return make_response_data(success=False, message="Car expense not found.", status_code=404)
                return make_response_data(data=expense.to_dict(), message="Car expense fetched successfully.")
            
            # Use result.mappings() for robust column mapping - handles empty tables
            expenses_result = db.session.execute(text("""
                SELECT id, driver_email, amount::text as amount_text, category, type, 
                       description, date, car_number_plate, car_name, stock_name
                FROM driver_expenses ORDER BY date DESC NULLS LAST
            """)).mappings().all()
            
            # Convert to dicts with safe float conversion
            expenses_data = []
            for row in expenses_result:
                expense_dict = {
                    'id': row['id'],
                    'driver_email': row['driver_email'],
                    'amount': safe_float(row['amount_text']),
                    'category': row['category'],
                    'type': row['type'],
                    'description': row['description'],
                    'date': row['date'].isoformat() if row['date'] else None,
                    'car_number_plate': row['car_number_plate'],
                    'car_name': row['car_name'],
                    'stock_name': row['stock_name'],
                }
                expenses_data.append(expense_dict)
            
            logger.info(f"Car expenses fetched successfully: {len(expenses_data)} records")
            return make_response_data(data=expenses_data, message="Car expenses fetched successfully.")
        except Exception as e:
            logger.error(f"Error fetching car expenses: {str(e)}", exc_info=True)
            db.session.rollback()
            return make_response_data(
                success=False,
                data=[],
                message=f"Failed to fetch car expenses: {str(e)}",
                status_code=500
            )

    @jwt_required()
    def post(self):
        data = request.get_json() or {}
        current_user = get_current_user()
        
        # Validate amount
        amount = data.get('amount')
        if amount is None or amount == '':
            return make_response_data(success=False, message="Amount is required.", status_code=400)
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return make_response_data(success=False, message="Amount must be a valid number.", status_code=400)
        
        try:
            expense_date = datetime.strptime(data.get('date', ''), '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)
        
        expense = DriverExpense(
            driver_email=current_user.email,
            amount=amount,
            category=data.get('category', 'fuel'),
            type=data.get('type'),
            description=data.get('description'),
            date=expense_date,
            car_number_plate=data.get('car_number_plate'),
            car_name=data.get('car_name'),
            stock_name=data.get('stock_name')
        )
        db.session.add(expense)
        db.session.commit()
        logger = logging.getLogger('car_expenses')
        logger.info(f"Car expense created: ID {expense.id} by {current_user.email}")
        return make_response_data(data=expense.to_dict(), message="Car expense created", status_code=201)

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

        report_type = request.args.get('type', 'daily')
        date = request.args.get('date')
        year = request.args.get('year')
        month = request.args.get('month')

        try:
            expenses = DriverExpense.query.filter_by(driver_email=driver_email).all()
            expense_data = [e.to_dict() for e in expenses]

            # Conditional PDF generator import
            pdf_generator = None
            try:
                from utils.pdf_generator import DriverExpensePDFGenerator
                pdf_generator = DriverExpensePDFGenerator()
            except ImportError as e:
                logging.getLogger('expenses').warning(f"PDF generator not available: {e}")

            if not pdf_generator:
                return make_response_data(
                    success=False, 
                    message="PDF report generator not available.", 
                    status_code=501
                )

            if report_type == 'daily':
                if not date:
                    from datetime import date as today_date
                    report_date = today_date.today()
                else:
                    report_date = datetime.strptime(date, '%Y-%m-%d').date()

                pdf_content = pdf_generator.generate_daily_report(expense_data, driver_email, report_date)
                filename = f"driver_expense_report_{driver_email}_{report_date.strftime('%Y%m%d')}.pdf"
            elif report_type == 'monthly':
                if not year or not month:
                    return make_response_data(success=False, message="Year and month required for monthly reports", status_code=400)
                year_int = int(year)
                month_int = int(month)
                if month_int < 1 or month_int > 12:
                    return make_response_data(success=False, message="Invalid month (1-12)", status_code=400)
                pdf_content = pdf_generator.generate_monthly_report(expense_data, driver_email, year_int, month_int)
                filename = f"driver_expense_report_{driver_email}_{year}_{month:02d}.pdf"
            else:
                return make_response_data(success=False, message="Invalid report type. Use 'daily' or 'monthly'", status_code=400)

            pdf_buffer = io.BytesIO(pdf_content)
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=filename,
                mimetype='application/pdf'
            )
        except Exception as e:
            logger = logging.getLogger('expenses')
            logger.error(f"Error generating driver expense report: {str(e)}", exc_info=True)
            return make_response_data(success=False, message=f"Error generating report: {str(e)}", status_code=500)
