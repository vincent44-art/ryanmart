from datetime import datetime
from extensions import db


class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    fruit_type = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(20))
    location = db.Column(db.String(100))
    expiry_date = db.Column(db.Date)
    purchase_price = db.Column(db.Float, nullable=True)
    purchase_date = db.Column(db.Date, nullable=True)
    added_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    stock_movements = db.relationship('StockMovement', backref='inventory_item', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'quantity': self.quantity,
            'fruit_type': self.fruit_type,
            'unit': self.unit,
            'location': self.location,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'purchase_price': self.purchase_price,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'added_by': self.added_by,
            'created_at': self.created_at.isoformat(),
        }
