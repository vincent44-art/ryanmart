from datetime import datetime
from backend.extensions import db

class Receipt(db.Model):
    __tablename__ = 'receipts'
    id = db.Column(db.Integer, primary_key=True)
    receipt_num = db.Column(db.String(50), unique=True, nullable=False)
    seller_name = db.Column(db.String(100))
    seller_address = db.Column(db.String(200))
    seller_phone = db.Column(db.String(20))
    buyer_name = db.Column(db.String(100))
    buyer_contact = db.Column(db.String(50))
    date = db.Column(db.Date, nullable=False)
    payment = db.Column(db.String(50))
    items = db.Column(db.Text)  # JSON string
    subtotal = db.Column(db.Float)
    discount = db.Column(db.Float)
    final_total = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'receiptNum': self.receipt_num,
            'seller': {
                'name': self.seller_name,
                'address': self.seller_address,
                'phone': self.seller_phone
            },
            'buyer': {
                'name': self.buyer_name,
                'contact': self.buyer_contact
            },
            'date': self.date.isoformat() if self.date else None,
            'payment': self.payment,
            'items': json.loads(self.items) if self.items else [],
            'subtotal': self.subtotal,
            'discount': self.discount,
            'finalTotal': self.final_total,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
