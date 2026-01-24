from flask_restful import Resource, reqparse
from flask import request, jsonify, current_app
import io
from flask_jwt_extended import jwt_required, get_current_user
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from flask import send_file

from extensions import db
from models.sales import Sale
from utils.decorators import role_required
from utils.helpers import make_response_data
import logging

logger = logging.getLogger('sales')

# Parser for POST/PUT requests
parser = reqparse.RequestParser()
parser.add_argument('stock_name', type=str, required=True)
parser.add_argument('fruit_name', type=str, required=True)
parser.add_argument('qty', type=float, required=True)
parser.add_argument('unit_price', type=float, required=True)
parser.add_argument('paid_amount', type=float, required=False, default=0.0)
parser.add_argument('customer_name', type=str, required=False)
parser.add_argument('date', type=str, required=False)


class SaleListResource(Resource):
    def get(self):
        try:
            # Pagination parameters
            page = request.args.get('page', default=1, type=int)
            per_page = request.args.get('per_page', default=20, type=int)

            # Query all sales (no authentication for debug)
            query = Sale.query.options(joinedload(Sale.seller))

            # Total count
            total = query.count()

            # Paginate
            sales = query.offset((page - 1) * per_page).limit(per_page).all()

            # Serialize
            sales_data = [{
                'id': sale.id,
                'stock_name': sale.stock_name,
                'fruit_name': sale.fruit_name,
                'qty': sale.qty,
                'unit_price': sale.unit_price,
                'amount': sale.amount,
                'paid_amount': sale.paid_amount,
                'remaining_amount': sale.remaining_amount,
                'customer_name': sale.customer_name,
                'date': sale.date.strftime('%Y-%m-%d'),
                'seller_email': sale.seller.email if hasattr(sale, 'seller') and sale.seller else None
            } for sale in sales]

            return make_response_data(data={
                'sales': sales_data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }, success=True, message='Sales fetched successfully', status_code=200)
        except Exception as e:
            logger.error(f"Error fetching sales: {str(e)}")
            db.session.rollback()
            return make_response_data(success=False, message=f"Error fetching sales: {str(e)}", status_code=500)

    @role_required('ceo', 'seller')
    def post(self):
        current_user = get_current_user()
        args = parser.parse_args()

        # Create new sale
        sale = Sale(
            seller_id=current_user.id,
            stock_name=args['stock_name'],
            fruit_name=args['fruit_name'],
            qty=args['qty'],
            unit_price=args['unit_price'],
            paid_amount=args.get('paid_amount', 0.0),
            amount=args['qty'] * args['unit_price'],
            remaining_amount=(args['qty'] * args['unit_price']) - args.get('paid_amount', 0.0),
            customer_name=args.get('customer_name'),
            date=(datetime.strptime(args['date'], '%Y-%m-%d').date() if args.get('date') else datetime.now().date())
        )

        db.session.add(sale)
        db.session.commit()

        # Serialize response
        sale_data = {
            'id': sale.id,
            'stock_name': sale.stock_name,
            'fruit_name': sale.fruit_name,
            'qty': sale.qty,
            'unit_price': sale.unit_price,
            'amount': sale.amount,
            'date': sale.date.strftime('%Y-%m-%d')
        }

        return make_response_data(True, 201, 'Sale created successfully', sale_data)


class SaleByEmailResource(Resource):
    """Fetch sales by seller email address."""
    @jwt_required()
    def get(self, email):
        try:
            # Find user by email
            from models.user import User
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return make_response_data(
                    success=False, 
                    message=f'User with email {email} not found', 
                    status_code=404
                )
            
            # Get all sales for this seller
            sales = Sale.query.filter_by(seller_id=user.id).order_by(Sale.date.desc()).all()
            
            sales_data = [{
                'id': sale.id,
                'stock_name': sale.stock_name,
                'fruit_name': sale.fruit_name,
                'qty': sale.qty,
                'unit_price': sale.unit_price,
                'amount': sale.amount,
                'paid_amount': sale.paid_amount,
                'remaining_amount': sale.remaining_amount,
                'customer_name': sale.customer_name,
                'date': sale.date.strftime('%Y-%m-%d') if sale.date else None,
                'seller_email': email,
                'created_at': sale.created_at.strftime('%Y-%m-%d %H:%M:%S') if sale.created_at else None
            } for sale in sales]
            
            return make_response_data(
                data=sales_data,
                success=True, 
                message=f'Sales fetched for {email}', 
                status_code=200
            )
        except Exception as e:
            logger.error(f"Error fetching sales for email {email}: {str(e)}")
            db.session.rollback()
            return make_response_data(
                success=False, 
                message=f"Error fetching sales: {str(e)}", 
                status_code=500
            )


class SaleResource(Resource):
    @role_required('ceo', 'seller')
    def get(self, sale_id):
        current_user = get_current_user()
        sale = Sale.query.filter_by(id=sale_id, seller_id=current_user.id if current_user.role == 'seller' else None).first_or_404()

        sale_data = {
            'id': sale.id,
            'stock_name': sale.stock_name,
            'fruit_name': sale.fruit_name,
            'qty': sale.qty,
            'unit_price': sale.unit_price,
            'amount': sale.amount,
            'date': sale.date.strftime('%Y-%m-%d'),
            'created_at': sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

        return make_response_data(True, 200, 'Sale fetched successfully', sale_data)

    @role_required('ceo', 'seller')
    def put(self, sale_id):
        current_user = get_current_user()
        sale = Sale.query.get_or_404(sale_id)
        args = parser.parse_args()

        # Update sale
        sale.stock_name = args['stock_name']
        sale.fruit_name = args['fruit_name']
        sale.qty = args['qty']
        sale.unit_price = args['unit_price']
        sale.paid_amount = args.get('paid_amount', 0.0)
        sale.amount = args['qty'] * args['unit_price']
        sale.remaining_amount = sale.amount - sale.paid_amount
        if 'customer_name' in args:
            sale.customer_name = args['customer_name']
        if args.get('date'):
            sale.date = datetime.strptime(args['date'], '%Y-%m-%d').date()

        db.session.commit()

        sale_data = {
            'id': sale.id,
            'stock_name': sale.stock_name,
            'fruit_name': sale.fruit_name,
            'qty': sale.qty,
            'unit_price': sale.unit_price,
            'amount': sale.amount,
            'date': sale.date.strftime('%Y-%m-%d'),
            'created_at': sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

        return make_response_data(True, 200, 'Sale updated successfully', sale_data)

    @role_required('ceo', 'seller')
    def delete(self, sale_id):
        current_user = get_current_user()
        sale = Sale.query.filter_by(id=sale_id, seller_id=current_user.id if current_user.role == 'seller' else None).first_or_404()

        db.session.delete(sale)
        db.session.commit()

        return make_response_data(True, 200, 'Sale deleted successfully', {'id': sale_id})


class SaleSummaryResource(Resource):
    @role_required('ceo', 'seller')
    def get(self):
        current_user = get_current_user()

        if current_user.role == 'seller':
            query = Sale.query.filter_by(seller_id=current_user.id)
            total_amount = db.session.query(func.sum(Sale.amount)).filter_by(seller_id=current_user.id).scalar() or 0
            avg_unit_price = db.session.query(func.avg(Sale.unit_price)).filter_by(seller_id=current_user.id).scalar() or 0
        else:
            query = Sale.query
            total_amount = db.session.query(func.sum(Sale.amount)).scalar() or 0
            avg_unit_price = db.session.query(func.avg(Sale.unit_price)).scalar() or 0

        total_sales = query.count()

        return make_response_data(True, 200, 'Sales summary fetched successfully', {
            'total_sales': total_sales,
            'total_amount': float(total_amount),
            'avg_unit_price': float(avg_unit_price)
        })


class ClearSalesResource(Resource):
    @role_required('ceo')
    def delete(self):
        current_user = get_current_user()
        if current_user.role != 'ceo':
            return make_response_data(False, 403, 'Only CEO can clear all sales'), 403

        num_deleted = Sale.query.delete()
        db.session.commit()

        return make_response_data(True, 200, f'{num_deleted} sales cleared successfully', {'deleted_count': num_deleted})

    @role_required('seller')
    def post(self):
        data = parser.parse_args()
        current_user = get_current_user()

        date_str = data.get('date')
        if date_str:
            try:
                sale_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return make_response_data(
                    success=False,
                    message="Invalid date format for date. Use YYYY-MM-DD.",
                    status_code=400
                )
        else:
            sale_date = datetime.now().date()

        # Calculate amount
        amount = data['qty'] * data['unit_price']

        new_sale = Sale(
            seller_id=current_user.id,
            stock_name=data['stock_name'],
            fruit_name=data['fruit_name'],
            qty=data['qty'],
            unit_price=data['unit_price'],
            amount=amount,
            date=sale_date
        )

        db.session.add(new_sale)
        db.session.commit()
        return make_response_data(
            data=new_sale.to_dict(),
            message="Sale recorded.",
            status_code=201
        )


class CustomerDebtResource(Resource):
    def get(self):
        # Aggregate remaining_amount by customer_name from sales
        from sqlalchemy import func
        debt_query = db.session.query(
            Sale.customer_name.label('customer_name'),
            func.sum(Sale.remaining_amount).label('total_debt')
        ).filter(Sale.customer_name.isnot(None)).group_by(Sale.customer_name).all()

        debt_data = [
            {
                'customer_name': row.customer_name,
                'total_debt': float(row.total_debt)
            }
            for row in debt_query
        ]

        return make_response_data(data={'debts': debt_data}, success=True, message='Customer debts fetched successfully', status_code=200)


class DailySalesReportResource(Resource):
    @role_required('ceo')
    def get(self, date_str):
        try:
            report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)

        # Get all sales for the specified date
        sales = Sale.query.filter_by(date=report_date).all()

        if not sales:
            return make_response_data(success=False, message=f"No sales found for {date_str}.", status_code=404)

        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"Daily Sales Report - {report_date.strftime('%B %d, %Y')}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Summary
        total_amount = sum(sale.amount for sale in sales)
        total_qty = sum(sale.qty for sale in sales)
        summary_text = f"Total Sales: {len(sales)} | Total Qty: {total_qty} | Total Amount: KES {total_amount:,.2f}"
        summary = Paragraph(summary_text, styles['Normal'])
        elements.append(summary)
        elements.append(Spacer(1, 12))

        # Table data
        data = [['Date', 'Seller', 'Stock Name', 'Fruit Name', 'Qty', 'Unit Price', 'Amount']]
        for sale in sales:
            data.append([
                sale.date.strftime('%Y-%m-%d'),
                sale.seller.email if sale.seller else 'N/A',
                sale.stock_name,
                sale.fruit_name,
                sale.qty,
                f'KES {sale.unit_price:,.2f}',
                f'KES {sale.amount:,.2f}'
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
            download_name=f"sales_report_{date_str}.pdf",
            mimetype='application/pdf'
        )


class CustomerDebtReportResource(Resource):
    @role_required('ceo')
    def get(self, customer_email):
        # Get all sales for the customer with remaining_amount > 0
        sales = Sale.query.filter(
            Sale.customer_name == customer_email,
            Sale.remaining_amount > 0
        ).all()

        if not sales:
            return make_response_data(success=False, message=f"No outstanding debts found for {customer_email}.", status_code=404)

        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"Customer Debt Report - {customer_email}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Summary
        total_debt = sum(sale.remaining_amount for sale in sales)
        total_amount = sum(sale.amount for sale in sales)
        total_paid = total_amount - total_debt
        summary_text = f"Total Amount: KES {total_amount:,.2f} | Total Paid: KES {total_paid:,.2f} | Outstanding Debt: KES {total_debt:,.2f}"
        summary = Paragraph(summary_text, styles['Normal'])
        elements.append(summary)
        elements.append(Spacer(1, 12))

        # Table data
        data = [['Date', 'Stock Name', 'Fruit Name', 'Qty', 'Unit Price', 'Amount', 'Paid Amount', 'Remaining Amount']]
        for sale in sales:
            data.append([
                sale.date.strftime('%Y-%m-%d'),
                sale.stock_name,
                sale.fruit_name,
                sale.qty,
                f'KES {sale.unit_price:,.2f}',
                f'KES {sale.amount:,.2f}',
                f'KES {sale.paid_amount:,.2f}',
                f'KES {sale.remaining_amount:,.2f}'
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
            download_name=f"debt_report_{customer_email.replace('@', '_')}.pdf",
            mimetype='application/pdf'
        )

