from flask_restful import Resource, reqparse
from flask import request, send_file
from extensions import db
from models.other_expense import OtherExpense
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io

parser = reqparse.RequestParser()
parser.add_argument('expense_type', type=str, required=True)
parser.add_argument('description', type=str, required=False)
parser.add_argument('amount', type=float, required=True)
parser.add_argument('date', type=str, required=True)

def generate_other_expenses_pdf(expenses, report_date):
    """
    Generate a PDF report for other expenses on a specific date

    Args:
        expenses: List of expense dictionaries
        report_date: Date for the report

    Returns:
        bytes: PDF content as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
    )

    story = []

    # Title
    title = Paragraph(f"Other Expenses Report", title_style)
    story.append(title)

    # Report info
    report_info = f"""
    <b>Report Date:</b> {report_date}<br/>
    <b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    story.append(Paragraph(report_info, styles['Normal']))
    story.append(Spacer(1, 12))

    if not expenses:
        no_data = Paragraph("No expenses recorded for this date.", styles['Normal'])
        story.append(no_data)
    else:
        # Summary statistics
        total_amount = sum(expense['amount'] for expense in expenses)
        expense_count = len(expenses)

        summary_data = [
            ['Summary Statistics', ''],
            ['Total Expenses', f"KES {total_amount:,.2f}"],
            ['Number of Expenses', str(expense_count)],
            ['Average per Expense', f"KES {total_amount/expense_count:,.2f}" if expense_count > 0 else 'N/A']
        ]

        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # Detailed expenses table
        story.append(Paragraph("Detailed Expenses", styles['Heading2']))

        # Prepare table data
        table_data = [['Type', 'Description', 'Amount (KES)', 'User ID']]

        for expense in expenses:
            table_data.append([
                expense.get('expense_type', ''),
                expense.get('description', ''),
                f"{expense.get('amount', 0):,.2f}",
                str(expense.get('user_id', ''))
            ])

        # Create expenses table
        expenses_table = Table(table_data)
        expenses_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (-2, 0), (-1, -1), 'RIGHT'),  # Right align amounts
        ]))

        story.append(expenses_table)

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

class OtherExpensesResource(Resource):
    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def get(self):
        expenses = OtherExpense.query.order_by(OtherExpense.date.desc()).all()
        return make_response_data(data=[e.to_dict() for e in expenses], message="Other expenses fetched successfully.")

    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def post(self):
        data = parser.parse_args()
        current_user = get_current_user()
        try:
            expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format for date. Use YYYY-MM-DD.", status_code=400)
        expense = OtherExpense(
            expense_type=data['expense_type'],
            description=data.get('description'),
            amount=data['amount'],
            date=expense_date,
            user_id=current_user.id
        )
        db.session.add(expense)
        db.session.commit()
        return make_response_data(data=expense.to_dict(), message="Other expense added successfully.", status_code=201)

class OtherExpenseResource(Resource):
    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def delete(self, expense_id):
        expense = OtherExpense.query.get(expense_id)
        if not expense:
            return make_response_data(success=False, message="Expense not found.", status_code=404)
        db.session.delete(expense)
        db.session.commit()
        return make_response_data(success=True, message="Expense deleted successfully.")

class OtherExpensesPDFResource(Resource):
    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def get(self):
        date_param = request.args.get('date')
        if not date_param:
            return make_response_data(success=False, message="Date parameter is required.", status_code=400)

        try:
            report_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)

        expenses = OtherExpense.query.filter(OtherExpense.date == report_date).all()
        expenses_data = [e.to_dict() for e in expenses]

        pdf_bytes = generate_other_expenses_pdf(expenses_data, date_param)

        from io import BytesIO
        pdf_buffer = BytesIO(pdf_bytes)
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"other_expenses_{date_param}.pdf",
            mimetype='application/pdf'
        )
