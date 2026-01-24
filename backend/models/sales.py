from extensions import db
from models.user import User
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sale'

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seller_fruit_id = db.Column(db.Integer, db.ForeignKey('seller_fruits.id'), nullable=True)
    stock_name = db.Column(db.String(100), nullable=False)
    fruit_name = db.Column(db.String(50), nullable=False)
    qty = db.Column(db.Float, nullable=False, default=0.0)
    unit_price = db.Column(db.Float, nullable=False, default=0.0)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    paid_amount = db.Column(db.Float, nullable=False, default=0.0)
    remaining_amount = db.Column(db.Float, nullable=False, default=0.0)
    customer_name = db.Column(db.String(100), nullable=True)
    date = db.Column(db.Date, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    seller = db.relationship('User', back_populates='sales', lazy=True)
    seller_fruit = db.relationship('SellerFruit', back_populates='sales', lazy=True)

    def __repr__(self):
        return f'<Sale {self.id}: {self.qty} units of {self.fruit_name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'seller_id': self.seller_id,
            'seller_fruit_id': self.seller_fruit_id,
            'stock_name': self.stock_name,
            'fruit_name': self.fruit_name,
            'qty': self.qty,
            'unit_price': self.unit_price,
            'amount': self.amount,
            'paid_amount': self.paid_amount,
            'remaining_amount': self.remaining_amount,
            'date': self.date.isoformat() if self.date else None,
            'seller_email': self.seller.email if self.seller else None,
            'customer_name': self.customer_name
        }
