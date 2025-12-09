from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime, date
import io

class DriverExpensePDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center alignment
        )
        self.header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=20,
        )

    def generate_daily_report(self, expenses, driver_email, report_date=None):
        """
        Generate a PDF report for daily driver expenses

        Args:
            expenses: List of expense dictionaries
            driver_email: Email of the driver
            report_date: Date for the report (defaults to today)

        Returns:
            bytes: PDF content as bytes
        """
        if report_date is None:
            report_date = date.today()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )

        # Build PDF content
        story = []

        # Title
        title = Paragraph(f"Driver Daily Expense Report", self.title_style)
        story.append(title)

        # Report info
        report_info = f"""
        <b>Driver:</b> {driver_email}<br/>
        <b>Report Date:</b> {report_date.strftime('%Y-%m-%d')}<br/>
        <b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        story.append(Paragraph(report_info, self.styles['Normal']))
        story.append(Spacer(1, 12))

        # Filter expenses for the specific date
        daily_expenses = [
            expense for expense in expenses
            if expense.get('date') and expense['date'] == report_date.strftime('%Y-%m-%d')
        ]

        if not daily_expenses:
            no_data = Paragraph("No expenses recorded for this date.", self.styles['Normal'])
            story.append(no_data)
        else:
            # Summary statistics
            total_amount = sum(expense['amount'] for expense in daily_expenses)
            expense_count = len(daily_expenses)

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
            story.append(Paragraph("Detailed Expenses", self.header_style))

            # Prepare table data
            table_data = [['Date', 'Type', 'Description', 'Car Details', 'Amount (KES)']]

            for expense in daily_expenses:
                car_details = ""
                if expense.get('car_number_plate'):
                    car_details += f"Plate: {expense['car_number_plate']}"
                if expense.get('car_name'):
                    car_details += f" | Car: {expense['car_name']}"
                if expense.get('stock_name'):
                    car_details += f" | Stock: {expense['stock_name']}"

                table_data.append([
                    expense.get('date', ''),
                    expense.get('type', ''),
                    expense.get('description', ''),
                    car_details or 'N/A',
                    f"{expense.get('amount', 0):,.2f}"
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
                ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),  # Right align amounts
            ]))

            story.append(expenses_table)

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_monthly_report(self, expenses, driver_email, year, month):
        """
        Generate a PDF report for monthly driver expenses

        Args:
            expenses: List of expense dictionaries
            driver_email: Email of the driver
            year: Year for the report
            month: Month for the report (1-12)

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

        story = []

        # Title
        month_name = datetime(year, month, 1).strftime('%B')
        title = Paragraph(f"Driver Monthly Expense Report - {month_name} {year}", self.title_style)
        story.append(title)

        # Report info
        report_info = f"""
        <b>Driver:</b> {driver_email}<br/>
        <b>Period:</b> {month_name} {year}<br/>
        <b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        story.append(Paragraph(report_info, self.styles['Normal']))
        story.append(Spacer(1, 12))

        # Filter expenses for the specific month
        monthly_expenses = []
        for expense in expenses:
            if expense.get('date'):
                try:
                    expense_date = datetime.strptime(expense['date'], '%Y-%m-%d').date()
                    if expense_date.year == year and expense_date.month == month:
                        monthly_expenses.append(expense)
                except ValueError:
                    continue

        if not monthly_expenses:
            no_data = Paragraph("No expenses recorded for this month.", self.styles['Normal'])
            story.append(no_data)
        else:
            # Summary statistics
            total_amount = sum(expense['amount'] for expense in monthly_expenses)
            expense_count = len(monthly_expenses)
            daily_average = total_amount / max(len(set(expense.get('date', '') for expense in monthly_expenses)), 1)

            summary_data = [
                ['Monthly Summary', ''],
                ['Total Expenses', f"KES {total_amount:,.2f}"],
                ['Number of Expenses', str(expense_count)],
                ['Daily Average', f"KES {daily_average:,.2f}"],
                ['Days with Expenses', str(len(set(expense.get('date', '') for expense in monthly_expenses)))]
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

            # Group expenses by date
            expenses_by_date = {}
            for expense in monthly_expenses:
                expense_date = expense.get('date', 'Unknown')
                if expense_date not in expenses_by_date:
                    expenses_by_date[expense_date] = []
                expenses_by_date[expense_date].append(expense)

            # Create daily breakdown
            for expense_date in sorted(expenses_by_date.keys()):
                story.append(Paragraph(f"Date: {expense_date}", self.header_style))

                day_expenses = expenses_by_date[expense_date]
                day_total = sum(expense['amount'] for expense in day_expenses)

                # Daily summary
                day_summary = f"Daily Total: KES {day_total:,.2f} | Expenses: {len(day_expenses)}"
                story.append(Paragraph(day_summary, self.styles['Italic']))
                story.append(Spacer(1, 10))

                # Daily expenses table
                table_data = [['Type', 'Description', 'Car Details', 'Amount (KES)']]

                for expense in day_expenses:
                    car_details = ""
                    if expense.get('car_number_plate'):
                        car_details += f"Plate: {expense['car_number_plate']}"
                    if expense.get('car_name'):
                        car_details += f" | Car: {expense['car_name']}"
                    if expense.get('stock_name'):
                        car_details += f" | Stock: {expense['stock_name']}"

                    table_data.append([
                        expense.get('type', ''),
                        expense.get('description', ''),
                        car_details or 'N/A',
                        f"{expense.get('amount', 0):,.2f}"
                    ])

                day_table = Table(table_data)
                day_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
                ]))
                story.append(day_table)
                story.append(Spacer(1, 15))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
