from flask import Blueprint, jsonify, request
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import func
from extensions import db
from models.purchases import Purchase
from models.user import UserRole, User
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from flask import send_file
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
import logging

# Blueprint for non-Resource routes
purchases_bp = Blueprint('purchases_bp', __name__)

# Parser for POST/PUT requests
parser = reqparse.RequestParser()
parser.add_argument('employeeName', type=str, required=True)
parser.add_argument('fruitType', type=str, required=True)
parser.add_argument('quantity', type=str, required=True)
parser.add_argument('unit', type=str, required=True)
parser.add_argument('buyerName', type=str, required=True)
parser.add_argument('amount', type=float, required=True)
parser.add_argument('date', type=str, required=True)
parser.add_argument('amountPerKg', type=float, required=True)


# --- New Routes ---
@purchases_bp.route("/ceo/messages", methods=["GET"])
def get_ceo_messages():
    # Replace with real CEO messages if needed
    return jsonify([]), 200





# --- Resource Classes ---
class PurchaseListResource(Resource):
    @role_required('ceo', 'purchaser')
    def get(self):
        current_user = get_current_user()
        logger = logging.getLogger('purchases')

        # Pagination parameters
        from flask import request
        page = request.args.get('page', default=1, type=int)
        per_page = request.args.get('per_page', default=20, type=int)

        try:
            # Both CEO and purchasers can see all purchases
            pagination = Purchase.query.order_by(Purchase.purchase_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
            purchases = pagination.items

            return make_response_data(
                data={
                    "items": [p.to_dict() for p in purchases],
                    "meta": {
                        "page": page,
                        "per_page": per_page,
                        "total": pagination.total,
                        "pages": pagination.pages
                    }
                },
                message="Purchases fetched."
            )
        except Exception as e:
            logger.error(f"Error fetching purchases: {str(e)}")
            db.session.rollback()
            return make_response_data(
                success=False,
                message="Failed to fetch purchases. Please try again later.",
                status_code=500
            )

    @role_required('purchaser')
    def post(self):
        data = parser.parse_args()
        current_user = get_current_user()
        logger = logging.getLogger('purchases')

        try:
            purchase_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(
                success=False,
                message="Invalid date format for date. Use YYYY-MM-DD.",
                status_code=400
            )

        try:
            new_purchase = Purchase(
                purchaser_id=current_user.id,
                employee_name=data['employeeName'],
                fruit_type=data['fruitType'],
                quantity=data['quantity'],
                unit=data['unit'],
                buyer_name=data['buyerName'],
                cost=data['amount'],
                purchase_date=purchase_date,
                amount_per_kg=data['amountPerKg']
            )
            db.session.add(new_purchase)
            db.session.commit()
            return make_response_data(
                data=new_purchase.to_dict(),
                message="Purchase recorded.",
                status_code=201
            )
        except Exception as e:
            logger.error(f"Error creating purchase: {str(e)}")
            db.session.rollback()
            return make_response_data(
                success=False,
                message="Failed to record purchase. Please try again later.",
                status_code=500
            )


class PurchaseResource(Resource):
    @role_required('ceo')
    def put(self, purchase_id):
        purchase = Purchase.query.get_or_404(purchase_id)
        data = parser.parse_args()

        purchase.supplier_name = data['supplier_name']
        purchase.fruit_type = data['fruit_type']
        purchase.quantity = data['quantity']
        purchase.cost = data['cost']
        purchase.purchase_date = datetime.strptime(
            data['purchase_date'], '%Y-%m-%d'
        ).date()

        db.session.commit()
        return make_response_data(
            data=purchase.to_dict(),
            message="Purchase record updated."
        )

    @role_required('ceo')
    def delete(self, purchase_id):
        purchase = Purchase.query.get_or_404(purchase_id)
        db.session.delete(purchase)
        db.session.commit()
        return make_response_data(message="Purchase record deleted.")


class ClearPurchasesResource(Resource):
    @role_required('ceo')
    def delete(self):
        num_deleted = Purchase.query.delete()
        db.session.commit()
        return make_response_data(
            message=f"Successfully cleared {num_deleted} purchase records."
        )


class PurchaseSummaryResource(Resource):
    @role_required('ceo')
    def get(self):
        total_cost = db.session.query(func.sum(Purchase.cost)).scalar() or 0
        cost_by_fruit = db.session.query(
            Purchase.fruit_type,
            func.sum(Purchase.cost)
        ).group_by(Purchase.fruit_type).all()

        summary = {
            'total_cost': total_cost,
            'cost_by_fruit': [
                {'fruit_type': fruit, 'total_cost': cost}
                for fruit, cost in cost_by_fruit
            ]
        }
        return make_response_data(data=summary, message="Purchase summary fetched.")

class PurchaseByEmailResource(Resource):
    def get(self):
        """
        Get purchases by purchaser email.
        Requires JWT authentication.
        Email is passed as query parameter.
        """
        logger = logging.getLogger('purchases')

        try:
            # Get current user from JWT to verify access
            current_user_id = get_jwt_identity()
            if not current_user_id:
                return make_response_data(
                    success=False,
                    message="Missing access token",
                    error="authorization_required",
                    status_code=401
                )

            current_user = User.query.get(current_user_id)
            if not current_user:
                return make_response_data(
                    success=False,
                    message="User not found.",
                    status_code=401
                )

            # Get email from query parameters
            email = request.args.get('email')
            if not email:
                return make_response_data(
                    success=False,
                    message="Email parameter is required.",
                    status_code=400
                )

            # Verify the requested email matches the current user's email
            # or if the user is a CEO/admin who can view all purchases
            user_role = str(current_user.role).upper() if current_user.role else ''
            if email != current_user.email and user_role not in ['CEO', 'ADMIN']:
                return make_response_data(
                    success=False,
                    message="Not authorized to view these purchases.",
                    status_code=403
                )

            user = User.query.filter_by(email=email).first()
            if not user:
                return make_response_data(
                    data=[],
                    message="No user found with this email."
                )

            purchases = Purchase.query.filter_by(purchaser_id=user.id).all()
            return make_response_data(
                data=[p.to_dict() for p in purchases],
                message="Purchases fetched successfully."
            )
        except Exception as e:
            logger.error(f"Error fetching purchases by email: {str(e)}")
            db.session.rollback()
            return make_response_data(
                success=False,
                message="Failed to fetch purchases. Please try again later.",
                status_code=500
            )


class DailyPurchasesReportResource(Resource):
    @role_required('ceo')
    def get(self, date_str):
        try:
            report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)

        # Get all purchases for the specified date
        purchases = Purchase.query.filter_by(purchase_date=report_date).all()

        if not purchases:
            return make_response_data(success=False, message=f"No purchases found for {date_str}.", status_code=404)

        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"Daily Purchases Report - {report_date.strftime('%B %d, %Y')}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Summary
        total_cost = sum(purchase.cost for purchase in purchases)
        total_quantity = sum(float(purchase.quantity) for purchase in purchases)
        summary_text = f"Total Purchases: {len(purchases)} | Total Quantity: {total_quantity:.2f} | Total Cost: KES {total_cost:,.2f}"
        summary = Paragraph(summary_text, styles['Normal'])
        elements.append(summary)
        elements.append(Spacer(1, 12))

        # Table data
        data = [['Date', 'Purchaser', 'Employee', 'Fruit Type', 'Quantity', 'Buyer', 'Amount']]
        for purchase in purchases:
            purchaser_email = purchase.purchaser.email if purchase.purchaser and hasattr(purchase.purchaser, 'email') else 'N/A'
            data.append([
                purchase.purchase_date.strftime('%Y-%m-%d'),
                purchaser_email,
                purchase.employee_name,
                purchase.fruit_type,
                f"{purchase.quantity} {purchase.unit}",
                purchase.buyer_name,
                f'KES {purchase.cost:,.2f}'
            ])

        # Create table
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        elements.append(table)

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"purchases_report_{date_str}.pdf",
            mimetype='application/pdf'
        )
