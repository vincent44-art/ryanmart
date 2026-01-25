from datetime import datetime
from .user import db

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
        # Use a separate query to get purchaser email to avoid relationship issues
        purchaser_email = None
        try:
            from models.user import User
            user = User.query.get(self.purchaser_id)
            if user:
                purchaser_email = user.email
        except Exception:
            # If there's an import error or query error, set email to None
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
