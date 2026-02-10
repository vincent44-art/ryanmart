from extensions import db
from datetime import datetime

class Spolige(db.Model):
    __tablename__ = 'spolige'
    id = db.Column(db.Integer, primary_key=True)
    fruit_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=0)
    stage = db.Column(db.String(50), nullable=False)  # e.g., 'fresh', 'partial', 'fully_spoiled'
    amount_per_kg = db.Column(db.Float, nullable=False, default=0)
    total_amount = db.Column(db.Float, nullable=False, default=0)
    description = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, default=datetime.utcnow)
    stock_tracking_id = db.Column(db.Integer, db.ForeignKey('stock_tracking.id'), nullable=True)  # Link to stock tracking record
    source = db.Column(db.String(50), nullable=True, default='manual')  # 'manual' or 'automatic'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'fruit_name': self.fruit_name,
            'quantity': self.quantity,
            'stage': self.stage,
            'amount_per_kg': self.amount_per_kg,
            'total_amount': self.total_amount,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'stock_tracking_id': self.stock_tracking_id,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

