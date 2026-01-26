from datetime import datetime
from .user import db
from .user import User  # Direct import at top level is safe

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    purchaser_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    employee_name = db.Column(db.String(100), nullable=False)
    fruit_type = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    buyer_name = db.Column(db.String(100), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    purchase_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    amount_per_kg = db.Column(db.Float, nullable=False, default=0)

    def to_dict(self):
        # Get purchaser email using the imported User model
        purchaser_email = None
        try:
            # Use db.session to query to avoid detached instance issues
            user = db.session.get(User, self.purchaser_id)
            if user:
                purchaser_email = user.email
        except Exception:
            # If there's any error, set email to None
            purchaser_email = None
        
        return {
            'id': self.id,
            'purchaser_id': self.purchaser_id,
            'purchaserEmail': purchaser_email,
            'employeeName': self.employee_name,
            'fruitType': self.fruit_type,
            'quantity': self.quantity,
            'unit': self.unit,
            'buyerName': self.buyer_name,
            'amount': self.cost,
            'amountPerKg': self.amount_per_kg,
            'date': self.purchase_date.isoformat() if self.purchase_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
