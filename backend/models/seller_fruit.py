from datetime import datetime
from extensions import db

class SellerFruit(db.Model):
    __tablename__ = 'seller_fruits'
    id = db.Column(db.Integer, primary_key=True)
    stock_name = db.Column(db.String(100), nullable=False)
    fruit_name = db.Column(db.String(50), nullable=False)
    qty = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    customer_name = db.Column(db.String(100), nullable=True)  # New field for customer name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # Relationships
    creator = db.relationship('User', backref='seller_fruits', lazy=True)
    sales = db.relationship('Sale', back_populates='seller_fruit', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'stock_name': self.stock_name,
            'fruit_name': self.fruit_name,
            'qty': self.qty,
            'unit_price': self.unit_price,
            'date': self.date.isoformat() if self.date else None,
            'amount': self.amount,
            'customer_name': self.customer_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by,
            'creator_email': self.creator.email if self.creator else None
        }
