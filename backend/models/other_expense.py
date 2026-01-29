from datetime import datetime
from extensions import db

class OtherExpense(db.Model):
    __tablename__ = 'other_expenses'

    id = db.Column(db.Integer, primary_key=True)
    expense_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<OtherExpense {self.id} {self.expense_type} {self.amount}>'

    def to_dict(self):
        return {
            'id': self.id,
            'expense_type': self.expense_type,
            'description': self.description,
            'amount': self.amount,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
