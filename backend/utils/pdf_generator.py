"""
Stub PDF Generator for Driver Expenses.
Returns minimal valid PDF bytes.
"""

class DriverExpensePDFGenerator:
    def __init__(self):
        pass

    def generate_daily(self, date_str="Daily Report", expenses_data=None):
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from io import BytesIO
            
            buffer = BytesIO()
            p = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter
            
            p.drawString(100, height - 100, f"Driver Expenses Report - {date_str}")
            p.drawString(100, height - 120, "Expenses data:")
            y = height - 150
            
            if expenses_data:
                for expense in expenses_data[:10]:  # Limit to 10
                    p.drawString(100, y, f"{expense.get('description', 'N/A')}: ${expense.get('amount', 0):.2f}")
                    y -= 20
            
            p.save()
            buffer.seek(0)
            return buffer.read()
        except ImportError:
            # Fallback minimal valid PDF bytes (reportlab not installed)
            pdf_bytes = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj 4 0 obj<</Length 60>>stream
BT /F1 24 Tf 100 700 Td (Driver Expenses Stub PDF) Tj ET
endstream endobj xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000073 00000 n 
0000000124 00000 n 
0000000200 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
300
%%EOF"""
            return pdf_bytes

