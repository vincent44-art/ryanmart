from flask_restful import Resource, reqparse
from extensions import db
from models.stock_tracking import StockTracking
from models.sales import Sale
from models.other_expense import OtherExpense
from models.driver import DriverExpense
from models.stock_movement import StockMovement
from models.inventory import Inventory
from models.purchases import Purchase
from utils.helpers import make_response_data
from utils.decorators import role_required
from datetime import datetime, timedelta
from flask import send_file, make_response, request, jsonify
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from sqlalchemy import cast, Float, func, text
import io
import logging


def safe_float(value, default=0.0):
    """Safely convert a value to float, handling strings and None"""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            # Extract numeric part from string
            import re
            match = re.search(r'(\d+(\.\d+)?)', value)
            return float(match.group(1)) if match else default
        except (ValueError, TypeError):
            return default
    return default


def safe_sum_float(query_result, default=0.0):
    """Safely sum query results that may contain string values"""
    if query_result is None:
        return default
    return safe_float(query_result, default)

parser = reqparse.RequestParser()
parser.add_argument('stockInId', type=str)  # For stock out updates
parser.add_argument('stockName', type=str)
parser.add_argument('dateIn', type=str)
parser.add_argument('fruitType', type=str)
parser.add_argument('quantityIn', type=float)
parser.add_argument('amountPerKg', type=float, default=0)
parser.add_argument('totalAmount', type=float, default=0)
parser.add_argument('otherCharges', type=float, default=0)
parser.add_argument('dateOut', type=str)
parser.add_argument('duration', type=int)
parser.add_argument('gradientUsed', type=str)
parser.add_argument('gradientAmountUsed', type=float)
parser.add_argument('gradientCostPerUnit', type=float)
parser.add_argument('totalGradientCost', type=float)
parser.add_argument('quantityOut', type=float)
parser.add_argument('spoilage', type=float)
parser.add_argument('totalStockCost', type=float)

class StockTrackingListResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self):
        # Get all individual records without aggregation
        records = StockTracking.query.order_by(StockTracking.date_in.desc()).all()

        # Return all records as individual entries
        data = [record.to_dict() for record in records]

        return make_response_data(data=data, message="Stock tracking records fetched.")

    @role_required('storekeeper', 'ceo')
    def post(self):
        data = parser.parse_args()
        try:
            # Check if this is an update (stock out) by presence of stockInId
            if data.get('stockInId'):
                # Update existing record for stock out
                record_id = int(data['stockInId'])
                record = StockTracking.query.get_or_404(record_id)

                # Automatically set date_out if not provided or invalid
                if not data.get('dateOut'):
                    date_out = datetime.now().date()
                else:
                    try:
                        date_out = datetime.strptime(data['dateOut'], '%Y-%m-%d').date()
                    except ValueError:
                        date_out = datetime.now().date()

                # Update the record with stock out data
                record.date_out = date_out
                record.duration = data.get('duration')
                record.gradient_used = data.get('gradientUsed')
                record.gradient_amount_used = data.get('gradientAmountUsed')
                record.gradient_cost_per_unit = data.get('gradientCostPerUnit')
                record.total_gradient_cost = data.get('totalGradientCost')
                record.quantity_out = data.get('quantityOut')
                record.spoilage = data.get('spoilage')
                record.total_stock_cost = data.get('totalStockCost')

                db.session.commit()
                return make_response_data(data=record.to_dict(), message="Stock tracking record updated for stock out.", status_code=200)
            else:
                # Create new record for stock in
                # Automatically set date_in to today if not provided or invalid
                if not data.get('dateIn'):
                    date_in = datetime.now().date()
                else:
                    try:
                        date_in = datetime.strptime(data['dateIn'], '%Y-%m-%d').date()
                    except ValueError:
                        date_in = datetime.now().date()

                # Automatically set date_out to None if not provided or invalid
                if not data.get('dateOut'):
                    date_out = None
                else:
                    try:
                        date_out = datetime.strptime(data['dateOut'], '%Y-%m-%d').date()
                    except ValueError:
                        date_out = None

                record = StockTracking(
                    stock_name=data['stockName'],
                    date_in=date_in,
                    fruit_type=data['fruitType'],
                    quantity_in=data['quantityIn'],
                    amount_per_kg=data['amountPerKg'],
                    total_amount=data['totalAmount'],
                    other_charges=data.get('otherCharges', 0),
                    date_out=date_out,
                    duration=data.get('duration'),
                    gradient_used=data.get('gradientUsed'),
                    gradient_amount_used=data.get('gradientAmountUsed'),
                    gradient_cost_per_unit=data.get('gradientCostPerUnit'),
                    total_gradient_cost=data.get('totalGradientCost'),
                    quantity_out=data.get('quantityOut'),
                    spoilage=data.get('spoilage'),
                    total_stock_cost=data.get('totalStockCost'),
                )
                db.session.add(record)
                db.session.commit()
                return make_response_data(data=record.to_dict(), message="Stock tracking record created.", status_code=201)

        except Exception as e:
            return make_response_data(success=False, message=f"Invalid date format or error: {str(e)}", status_code=400)

class ClearStockTrackingResource(Resource):
    @role_required('ceo')
    def delete(self):
        num_deleted = StockTracking.query.delete()
        db.session.commit()
        return make_response_data(message=f"Successfully cleared {num_deleted} stock tracking records.")


def generate_stock_pdf(stock_record):
    """Generate PDF for a stock tracking record"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10,
        textColor=colors.darkblue,
    )

    content_style = styles['Normal']

    # Build PDF content
    elements = []

    # Title
    elements.append(Paragraph(f"Stock Tracking Report - {stock_record.stock_name}", title_style))
    elements.append(Spacer(1, 12))

    # Basic Information Section
    elements.append(Paragraph("Basic Information", section_style))
    elements.append(Spacer(1, 6))

    basic_data = [
        ['Stock Name', stock_record.stock_name],
        ['Date In', stock_record.date_in.strftime('%Y-%m-%d') if stock_record.date_in else 'N/A'],
        ['Date Out', stock_record.date_out.strftime('%Y-%m-%d') if stock_record.date_out else 'N/A'],
        ['Duration (days)', str(stock_record.duration) if stock_record.duration else 'N/A'],
    ]

    basic_table = Table(basic_data, colWidths=[2*inch, 3*inch])
    basic_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(basic_table)
    elements.append(Spacer(1, 20))

    # Quantity and Pricing Section
    elements.append(Paragraph("Stock Summary", section_style))
    elements.append(Spacer(1, 6))

    quantity_data = [
        ['Fruit Type', stock_record.fruit_type],
        ['Quantity In', f"{stock_record.quantity_in} units"],
        ['Quantity Out', f"{stock_record.quantity_out or 0} units"],
        ['Spoilage', f"{stock_record.spoilage or 0} units"],
        ['Amount per Kg', f"KES {stock_record.amount_per_kg:.2f}"],
        ['Total Amount', f"KES {stock_record.total_amount:.2f}"],
        ['Other Charges', f"KES {stock_record.other_charges:.2f}"],
    ]

    quantity_table = Table(quantity_data, colWidths=[2*inch, 2.5*inch])
    quantity_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(quantity_table)
    elements.append(Spacer(1, 20))

    # Gradient Information Section (if applicable)
    if stock_record.gradient_used:
        elements.append(Paragraph("Gradient Information", section_style))
        elements.append(Spacer(1, 6))

        gradient_data = [
            ['Gradient Used', stock_record.gradient_used],
            ['Gradient Amount Used', f"{stock_record.gradient_amount_used or 0} units"],
            ['Gradient Cost per Unit', f"KES {stock_record.gradient_cost_per_unit or 0:.2f}"],
            ['Total Gradient Cost', f"KES {stock_record.total_gradient_cost or 0:.2f}"],
        ]

        gradient_table = Table(gradient_data, colWidths=[2*inch, 2.5*inch])
        gradient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(gradient_table)
        elements.append(Spacer(1, 20))

    # Profit/Loss Section
    elements.append(Paragraph("Profit/Loss Summary", section_style))
    elements.append(Spacer(1, 6))

    total_revenue = (stock_record.quantity_out or 0) * stock_record.amount_per_kg
    total_costs = (stock_record.total_amount + stock_record.other_charges + (stock_record.total_gradient_cost or 0))
    profit_loss = total_revenue - total_costs

    profit_data = [
        ['Total Revenue', f"KES {total_revenue:.2f}"],
        ['Total Costs', f"KES {total_costs:.2f}"],
        ['Profit/Loss', f"KES {profit_loss:.2f}"],
    ]

    profit_table = Table(profit_data, colWidths=[2*inch, 2.5*inch])
    profit_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(profit_table)

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'), styles['Italic']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_stock_pdf_group(records, date, type_):
    """Generate PDF for a group of stock tracking records (same date in or out)"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10,
        textColor=colors.darkblue,
    )

    content_style = styles['Normal']

    # Build PDF content
    elements = []

    # Title
    type_text = "Stock In" if type_ == 'in' else "Stock Out"
    elements.append(Paragraph(f"Stock Tracking Report - {type_text} - {date}", title_style))
    elements.append(Spacer(1, 12))

    # Summary Section
    elements.append(Paragraph("Summary", section_style))
    elements.append(Spacer(1, 6))

    total_quantity = sum(r.quantity_in if type_ == 'in' else (r.quantity_out or 0) for r in records)
    total_amount = sum(r.total_amount for r in records)
    total_other_charges = sum(r.other_charges for r in records)
    total_gradient_cost = sum(r.total_gradient_cost or 0 for r in records)

    summary_data = [
        ['Total Records', str(len(records))],
        ['Total Quantity', f"{total_quantity} units"],
        ['Total Amount', f"KES {total_amount:.2f}"],
        ['Total Other Charges', f"KES {total_other_charges:.2f}"],
        ['Total Gradient Cost', f"KES {total_gradient_cost:.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[2*inch, 2.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # Detailed Records Section
    elements.append(Paragraph("Detailed Records", section_style))
    elements.append(Spacer(1, 6))

    # Table headers
    headers = ['Fruit Name', 'Qty Brought', 'Qty Sold', 'Purchased Amount', 'Amount Sold']
    if type_ == 'out':
        headers.extend(['Gradient Used', 'Gradient Cost', 'Date Out', 'Spoilage'])

    table_data = [headers]

    for record in records:
        sold_amount = record.quantity_out * record.amount_per_kg if record.quantity_out else 0
        row = [
            record.fruit_type,
            f"{record.quantity_in}",
            f"{record.quantity_out or 0}",
            f"KES {record.total_amount:.2f}",
            f"KES {sold_amount:.2f}",
        ]
        if type_ == 'out':
            row.extend([
                record.gradient_used or 'N/A',
                f"KES {record.total_gradient_cost or 0:.2f}",
                record.date_out.strftime('%Y-%m-%d') if record.date_out else 'N/A',
                f"{record.spoilage or 0} units",
            ])
        table_data.append(row)

    # Calculate column widths
    col_widths = [1.2*inch] * len(headers)

    records_table = Table(table_data, colWidths=col_widths)
    records_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(records_table)

    # Sales Section for Stock Out PDFs
    if type_ == 'out':
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Sales Records", section_style))
        elements.append(Spacer(1, 6))

        # Get all sales for the stock names in this group
        stock_names = [r.stock_name for r in records]
        sales_records = Sale.query.filter(Sale.stock_name.in_(stock_names)).order_by(Sale.date.desc()).all()

        if sales_records:
            sales_headers = ['Date', 'Fruit Name', 'Quantity', 'Amount']
            sales_table_data = [sales_headers]

            for sale in sales_records:
                sales_table_data.append([
                    sale.date.strftime('%Y-%m-%d') if sale.date else 'N/A',
                    sale.fruit_name,
                    f"{sale.qty}",
                    f"KES {sale.amount:.2f}"
                ])

            sales_table = Table(sales_table_data, colWidths=[1.2*inch, 1.5*inch, 1*inch, 1.2*inch])
            sales_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightcoral),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(sales_table)
        else:
            elements.append(Paragraph("No sales records found for this stock group.", styles['Italic']))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'), styles['Italic']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_unmoved_stock_pdf(records):
    """Generate PDF for all stock tracking records that have not moved out (date_out is None)"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10,
        textColor=colors.darkblue,
    )

    content_style = styles['Normal']

    # Build PDF content
    elements = []

    # Title
    elements.append(Paragraph("Stock Tracking Report - Unmoved Stocks", title_style))
    elements.append(Spacer(1, 12))

    # Summary Section
    elements.append(Paragraph("Summary", section_style))
    elements.append(Spacer(1, 6))

    total_quantity = sum(r.quantity_in for r in records)
    total_amount = sum(r.total_amount for r in records)
    total_other_charges = sum(r.other_charges for r in records)
    total_gradient_cost = sum(r.total_gradient_cost or 0 for r in records)

    summary_data = [
        ['Total Records', str(len(records))],
        ['Total Quantity In', f"{total_quantity} units"],
        ['Total Amount', f"KES {total_amount:.2f}"],
        ['Total Other Charges', f"KES {total_other_charges:.2f}"],
        ['Total Gradient Cost', f"KES {total_gradient_cost:.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[2*inch, 2.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # Detailed Records Section
    elements.append(Paragraph("Detailed Records", section_style))
    elements.append(Spacer(1, 6))

    # Table headers
    headers = ['Stock Name', 'Fruit Type', 'Date In', 'Quantity In', 'Amount per Kg', 'Total Amount', 'Other Charges', 'Gradient Used', 'Gradient Cost']

    table_data = [headers]

    for record in records:
        row = [
            record.stock_name,
            record.fruit_type,
            record.date_in.strftime('%Y-%m-%d') if record.date_in else 'N/A',
            f"{record.quantity_in}",
            f"KES {record.amount_per_kg:.2f}",
            f"KES {record.total_amount:.2f}",
            f"KES {record.other_charges:.2f}",
            record.gradient_used or 'N/A',
            f"KES {record.total_gradient_cost or 0:.2f}",
        ]
        table_data.append(row)

    # Calculate column widths
    col_widths = [1.2*inch] * len(headers)

    records_table = Table(table_data, colWidths=col_widths)
    records_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(records_table)

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'), styles['Italic']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


class StockTrackingPDFResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self, record_id):
        try:
            record = StockTracking.query.get_or_404(record_id)
            pdf_buffer = generate_stock_pdf(record)

            response = make_response(pdf_buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=stock_report_{record.stock_name}_{record.id}.pdf'

            return response
        except Exception as e:
            return make_response_data(success=False, message=f"Error generating PDF: {str(e)}", status_code=500)

class StockTrackingGroupPDFResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self):
        try:
            date = request.args.get('date')
            type_ = request.args.get('type')  # 'in' or 'out'

            if not date or type_ not in ['in', 'out']:
                return make_response_data(success=False, message="Invalid parameters", status_code=400)

            if type_ == 'in':
                records = StockTracking.query.filter(StockTracking.date_in == date, StockTracking.date_out.is_(None)).all()
            elif type_ == 'out':
                records = StockTracking.query.filter(StockTracking.date_out == date).all()

            if not records:
                return make_response_data(success=False, message="No records found for the specified date", status_code=404)

            pdf_buffer = generate_stock_pdf_group(records, date, type_)
            response = make_response(pdf_buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=stock_report_{type_}_{date}.pdf'

            return response
        except Exception as e:
            return make_response_data(success=False, message=f"Error generating group PDF: {str(e)}", status_code=500)


class StockTrackingUnmovedPDFResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self):
        try:
            # Get all records where date_out is None
            records = StockTracking.query.filter(StockTracking.date_out.is_(None)).all()

            if not records:
                return make_response_data(success=False, message="No unmoved stock records found", status_code=404)

            pdf_buffer = generate_unmoved_stock_pdf(records)
            response = make_response(pdf_buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = 'attachment; filename=stock_report_unmoved.pdf'

            return response
        except Exception as e:
            return make_response_data(success=False, message=f"Error generating unmoved stock PDF: {str(e)}", status_code=500)


def generate_stock_pdf_combined(date):
    """Generate PDF for both in and out stock tracking records for a specific date"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10,
        textColor=colors.darkblue,
    )

    content_style = styles['Normal']

    # Build PDF content
    elements = []

    # Title
    elements.append(Paragraph(f"Stock Tracking Report - Combined In/Out - {date}", title_style))
    elements.append(Spacer(1, 12))

    # Get stocks in and out for the date
    stocks_in = StockTracking.query.filter(StockTracking.date_in == date, StockTracking.date_out.is_(None)).all()
    stocks_out = StockTracking.query.filter(StockTracking.date_out == date).all()

    # Overall Summary Section
    elements.append(Paragraph("Overall Summary", section_style))
    elements.append(Spacer(1, 6))

    total_in_quantity = sum(r.quantity_in for r in stocks_in)
    total_in_amount = sum(r.total_amount for r in stocks_in)
    total_out_quantity = sum(r.quantity_out or 0 for r in stocks_out)
    total_out_revenue = sum((r.quantity_out or 0) * r.amount_per_kg for r in stocks_out)

    overall_data = [
        ['Total Stocks In', str(len(stocks_in))],
        ['Total Quantity In', f"{total_in_quantity} units"],
        ['Total Amount In', f"KES {total_in_amount:.2f}"],
        ['Total Stocks Out', str(len(stocks_out))],
        ['Total Quantity Out', f"{total_out_quantity} units"],
        ['Total Revenue Out', f"KES {total_out_revenue:.2f}"],
    ]

    overall_table = Table(overall_data, colWidths=[2*inch, 2.5*inch])
    overall_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(overall_table)
    elements.append(Spacer(1, 20))

    # Stocks In Section
    if stocks_in:
        elements.append(Paragraph("Stocks In", section_style))
        elements.append(Spacer(1, 6))

        in_headers = ['Stock Name', 'Fruit Type', 'Quantity In', 'Amount per Kg', 'Total Amount', 'Other Charges']
        in_table_data = [in_headers]

        for record in stocks_in:
            row = [
                record.stock_name,
                record.fruit_type,
                f"{record.quantity_in}",
                f"KES {record.amount_per_kg:.2f}",
                f"KES {record.total_amount:.2f}",
                f"KES {record.other_charges:.2f}",
            ]
            in_table_data.append(row)

        in_table = Table(in_table_data, colWidths=[1.2*inch, 1.2*inch, 1*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        in_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(in_table)
        elements.append(Spacer(1, 20))

    # Stocks Out Section
    if stocks_out:
        elements.append(Paragraph("Stocks Out", section_style))
        elements.append(Spacer(1, 6))

        out_headers = ['Stock Name', 'Fruit Type', 'Quantity Out', 'Amount per Kg', 'Revenue', 'Gradient Used', 'Gradient Cost', 'Spoilage', 'Date Out']
        out_table_data = [out_headers]

        for record in stocks_out:
            revenue = (record.quantity_out or 0) * record.amount_per_kg
            row = [
                record.stock_name,
                record.fruit_type,
                f"{record.quantity_out or 0}",
                f"KES {record.amount_per_kg:.2f}",
                f"KES {revenue:.2f}",
                record.gradient_used or 'N/A',
                f"KES {record.total_gradient_cost or 0:.2f}",
                f"{record.spoilage or 0} units",
                record.date_out.strftime('%Y-%m-%d') if record.date_out else 'N/A',
            ]
            out_table_data.append(row)

        out_table = Table(out_table_data, colWidths=[1*inch, 1*inch, 0.8*inch, 1*inch, 1*inch, 1*inch, 1*inch, 0.8*inch, 1*inch])
        out_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightcoral),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(out_table)
        elements.append(Spacer(1, 20))

        # Sales Records for Stocks Out
        elements.append(Paragraph("Sales Records for Stocks Out", section_style))
        elements.append(Spacer(1, 6))

        # Get all sales for the stock names in the out stocks
        stock_names = [r.stock_name for r in stocks_out]
        sales_records = Sale.query.filter(Sale.stock_name.in_(stock_names)).order_by(Sale.date.desc()).all()

        if sales_records:
            sales_headers = ['Date', 'Fruit Name', 'Quantity', 'Amount']
            sales_table_data = [sales_headers]

            for sale in sales_records:
                sales_table_data.append([
                    sale.date.strftime('%Y-%m-%d') if sale.date else 'N/A',
                    sale.fruit_name,
                    f"{sale.qty}",
                    f"KES {sale.amount:.2f}"
                ])

            sales_table = Table(sales_table_data, colWidths=[1.2*inch, 1.5*inch, 1*inch, 1.2*inch])
            sales_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightyellow),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(sales_table)
        else:
            elements.append(Paragraph("No sales records found for the stocks out on this date.", styles['Italic']))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'), styles['Italic']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


class StockTrackingCombinedPDFResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self):
        try:
            date = request.args.get('date')

            if not date:
                return make_response_data(success=False, message="Date parameter is required", status_code=400)

            # Check if there are any stocks in or out on this date
            stocks_in = StockTracking.query.filter(StockTracking.date_in == date, StockTracking.date_out.is_(None)).all()
            stocks_out = StockTracking.query.filter(StockTracking.date_out == date).all()

            if not stocks_in and not stocks_out:
                return make_response_data(success=False, message="No stock records found for the specified date", status_code=404)

            pdf_buffer = generate_stock_pdf_combined(date)
            response = make_response(pdf_buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=stock_report_combined_{date}.pdf'

            return response
        except Exception as e:
            return make_response_data(success=False, message=f"Error generating combined PDF: {str(e)}", status_code=500)


class StockTrackingAggregatedResource(Resource):
    @role_required('storekeeper', 'ceo', 'seller', 'purchaser', 'driver', 'admin', 'it')
    def get(self):
        try:
            # Set up logging
            logger = logging.getLogger('stock_tracking')
            logger.info("Fetching aggregated stock tracking data")

            # Get all stock tracking records
            stocks = StockTracking.query.all()
            logger.info(f"Found {len(stocks)} stock tracking records")

            # Group stocks by stock_name
            stock_groups = {}
            for stock in stocks:
                name = stock.stock_name
                if name not in stock_groups:
                    stock_groups[name] = []
                stock_groups[name].append(stock)

            aggregated_data = []

            for stock_name, stock_list in stock_groups.items():
                try:
                    # Aggregate basic info
                    fruit_type = stock_list[0].fruit_type  # Assume same for group
                    total_purchase_cost = sum(stock.total_amount for stock in stock_list)
                    total_quantity_in = sum(stock.quantity_in for stock in stock_list)
                    earliest_date_in = min((stock.date_in for stock in stock_list if stock.date_in), default=None)
                    latest_date_out = max((stock.date_out for stock in stock_list if stock.date_out), default=None)

                    # Calculate storage usage from stock movements (sum for all stocks in group)
                    # Note: StockMovement.quantity is VARCHAR, so we sum in Python instead of SQL
                    storage_usage = 0
                    try:
                        stock_movements = StockMovement.query.join(Inventory).filter(
                            Inventory.name == stock_name,
                            StockMovement.movement_type == 'out'
                        ).all()
                        storage_usage = sum(safe_float(sm.quantity) for sm in stock_movements)
                    except Exception as e:
                        logger.warning(f"Error calculating storage usage for stock {stock_name}: {str(e)}")
                        storage_usage = 0
                        db.session.rollback()

                    # Calculate transport costs from driver expenses (sum for group)
                    transport_costs = 0
                    try:
                        driver_expenses = DriverExpense.query.filter(
                            DriverExpense.stock_name == stock_name
                        ).all()
                        # Sum safely in Python to avoid numeric type issues
                        transport_costs = sum(safe_float(de.amount) for de in driver_expenses)
                    except Exception as e:
                        logger.warning(f"Error calculating transport costs for stock {stock_name}: {str(e)}")
                        transport_costs = 0
                        db.session.rollback()

                    # Calculate other expenses (link by date range - 7 days before/after group dates)
                    other_expenses = 0
                    try:
                        if earliest_date_in or latest_date_out:
                            stock_date = earliest_date_in or latest_date_out or datetime.now().date()
                            date_start = stock_date - timedelta(days=7)
                            date_end = (latest_date_out or stock_date) + timedelta(days=7)
                        else:
                            # If no dates, use a wide range or skip
                            date_start = datetime.now().date() - timedelta(days=30)
                            date_end = datetime.now().date() + timedelta(days=30)

                        other_expenses_list = OtherExpense.query.filter(
                            OtherExpense.date >= date_start,
                            OtherExpense.date <= date_end
                        ).all()
                        # Sum safely in Python to avoid numeric type issues
                        other_expenses = sum(safe_float(oe.amount) for oe in other_expenses_list)
                    except Exception as e:
                        logger.warning(f"Error calculating other expenses for stock {stock_name}: {str(e)}")
                        other_expenses = 0
                        db.session.rollback()

                    # Calculate revenue and quantity sold from sales (sum for stock_name from date_start to now)
                    revenue = 0
                    quantity_sold = 0
                    try:
                        date_start = earliest_date_in or datetime.now().date() - timedelta(days=365)
                        date_end = datetime.now().date()  # Include all sales up to current date
                        sales_query = Sale.query.filter(
                            Sale.stock_name == stock_name,
                            Sale.date >= date_start,
                            Sale.date <= date_end
                        ).all()
                        # Sum safely in Python to avoid numeric type issues
                        revenue = sum(safe_float(s.amount) for s in sales_query)
                        quantity_sold = sum(safe_float(s.qty) for s in sales_query)
                    except Exception as e:
                        logger.warning(f"Error calculating revenue and quantity sold for stock {stock_name}: {str(e)}")
                        revenue = 0
                        quantity_sold = 0
                        db.session.rollback()

                    # Calculate profit/loss
                    total_costs = total_purchase_cost + transport_costs + other_expenses
                    profit_loss = revenue - total_costs

                    aggregated_data.append({
                        'stock_name': stock_name,
                        'fruit_type': fruit_type,
                        'purchase_cost': total_purchase_cost,
                        'storage_usage': storage_usage,
                        'transport_costs': transport_costs,
                        'other_expenses': other_expenses,
                        'revenue': revenue,
                        'quantity_sold': quantity_sold,
                        'profit_loss': profit_loss,
                        'date_in': earliest_date_in.isoformat() if earliest_date_in else None,
                        'date_out': latest_date_out.isoformat() if latest_date_out else None,
                        'total_quantity_in': total_quantity_in
                    })

                except Exception as e:
                    logger.error(f"Error processing stock group {stock_name}: {str(e)}")
                    continue

            # Also calculate fruit profitability summary from purchases and sales
            fruit_profitability = {}

            # Get purchases with error handling - fetch all and sum in Python
            try:
                purchases = Purchase.query.all()
            except Exception as e:
                logger.error(f"Error fetching purchases: {str(e)}")
                db.session.rollback()
                purchases = []

            # Get sales with error handling - fetch all and sum in Python
            try:
                # Use raw SQL to fetch sales as strings to avoid numeric type conversion issues
                sales_result = db.session.execute(text("SELECT id, seller_id, seller_fruit_id, stock_name, fruit_name, qty::text, unit_price::text, amount::text, paid_amount::text, remaining_amount::text, customer_name, date, created_at FROM sale")).fetchall()
                # Convert to dict-like objects for compatibility
                sales = []
                for row in sales_result:
                    sale_dict = {
                        'id': row[0],
                        'seller_id': row[1],
                        'seller_fruit_id': row[2],
                        'stock_name': row[3],
                        'fruit_name': row[4],
                        'qty': row[5],
                        'unit_price': row[6],
                        'amount': row[7],
                        'paid_amount': row[8],
                        'remaining_amount': row[9],
                        'customer_name': row[10],
                        'date': row[11],
                        'created_at': row[12]
                    }
                    sales.append(type('SaleObj', (), sale_dict)())
            except Exception as e:
                logger.error(f"Error fetching sales: {str(e)}")
                db.session.rollback()
                sales = []

            # Get seller fruits with error handling
            try:
                from models.seller_fruit import SellerFruit
                seller_fruits = SellerFruit.query.all()
            except Exception as e:
                logger.error(f"Error fetching seller fruits: {str(e)}")
                db.session.rollback()
                seller_fruits = []

            # Aggregate purchases
            for purchase in purchases:
                try:
                    fruit = purchase.fruit_type
                    if fruit not in fruit_profitability:
                        fruit_profitability[fruit] = {
                            'fruit_name': fruit,
                            'total_purchased': 0,
                            'total_sold': 0,
                            'total_revenue': 0,
                            'total_costs': 0
                        }

                    # Use the already parsed quantity and cost from raw SQL fetch
                    quantity = safe_float(purchase.quantity)
                    cost = safe_float(purchase.cost)

                    fruit_profitability[fruit]['total_purchased'] += quantity
                    fruit_profitability[fruit]['total_costs'] += cost

                except Exception as e:
                    logger.error(f"Error processing purchase for fruit {purchase.fruit_type}: {str(e)}")
                    continue

            # Aggregate sales (from sales table and seller_fruits table)
            sales_records = sales + seller_fruits
            for sale in sales_records:
                try:
                    fruit = sale.fruit_name
                    if fruit not in fruit_profitability:
                        fruit_profitability[fruit] = {
                            'fruit_name': fruit,
                            'total_purchased': 0,
                            'total_sold': 0,
                            'total_revenue': 0,
                            'total_costs': 0
                        }

                    # Use safe_float for qty and amount
                    fruit_profitability[fruit]['total_sold'] += safe_float(sale.qty)
                    fruit_profitability[fruit]['total_revenue'] += safe_float(sale.amount)

                except Exception as e:
                    logger.error(f"Error processing sale for fruit {sale.fruit_name}: {str(e)}")
                    continue

            # Calculate profit margin for each fruit
            for fruit_data in fruit_profitability.values():
                fruit_data['profit_margin'] = fruit_data['total_revenue'] - fruit_data['total_costs']

            logger.info(f"Successfully processed {len(aggregated_data)} stock records and {len(fruit_profitability)} fruit types")

            return make_response_data(
                data={
                    'stock_expenses': aggregated_data,
                    'fruit_profitability': list(fruit_profitability.values())
                },
                message="Aggregated stock tracking data fetched successfully."
            )

        except Exception as e:
            db.session.rollback()
            logger = logging.getLogger('stock_tracking')
            logger.error(f"Error fetching aggregated data: {str(e)}")
            return make_response_data(success=False, message=f"Error fetching aggregated data: {str(e)}", status_code=500)
