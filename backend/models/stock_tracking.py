from extensions import db
from datetime import date

class StockTracking(db.Model):
    __tablename__ = 'stock_tracking'
    id = db.Column(db.Integer, primary_key=True)
    stock_name = db.Column(db.String(128), nullable=False)
    date_in = db.Column(db.Date, nullable=False)
    fruit_type = db.Column(db.String(64), nullable=False)
    quantity_in = db.Column(db.Float, nullable=False)
    amount_per_kg = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    other_charges = db.Column(db.Float, default=0)
    date_out = db.Column(db.Date)
    duration = db.Column(db.Integer)
    gradient_used = db.Column(db.String(128))
    gradient_amount_used = db.Column(db.Float)
    gradient_cost_per_unit = db.Column(db.Float)
    total_gradient_cost = db.Column(db.Float)
    quantity_out = db.Column(db.Float)
    spoilage = db.Column(db.Float)
    total_stock_cost = db.Column(db.Float)

    def to_dict(self):
        return {
            'id': self.id,
            'stockName': self.stock_name,
            'dateIn': self.date_in.isoformat() if self.date_in else None,
            'fruitType': self.fruit_type,
            'quantityIn': self.quantity_in,
            'amountPerKg': self.amount_per_kg,
            'totalAmount': self.total_amount,
            'otherCharges': self.other_charges,
            'dateOut': self.date_out.isoformat() if self.date_out else None,
            'duration': self.duration,
            'gradientUsed': self.gradient_used,
            'gradientAmountUsed': self.gradient_amount_used,
            'gradientCostPerUnit': self.gradient_cost_per_unit,
            'totalGradientCost': self.total_gradient_cost,
            'quantityOut': self.quantity_out,
            'spoilage': self.spoilage,
            'totalStockCost': self.total_stock_cost,
        }
