from datetime import datetime
from extensions import db

class StockMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=False)
    movement_type = db.Column(db.String(10), nullable=False)  # 'in', 'out', 'sale', 'spoilage'
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))
    remaining_stock = db.Column(db.Float)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    selling_price = db.Column(db.Float, nullable=True)
    added_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_item = db.relationship('Inventory', back_populates='stock_movements', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'inventory_id': self.inventory_id,
            'inventory_item_name': self.inventory_item.name if self.inventory_item else None,
            'movement_type': self.movement_type,
            'quantity': self.quantity,
            'unit': self.unit,
            'remaining_stock': self.remaining_stock,
            'date': self.date.isoformat(),
            'notes': self.notes,
            'selling_price': self.selling_price,
            'added_by': self.added_by,
            'created_at': self.created_at.isoformat()
        }
