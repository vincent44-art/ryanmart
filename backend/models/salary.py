from . import db
from datetime import datetime

class Salary(db.Model):
    __tablename__ = 'salaries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    date = db.Column(db.Date, default=datetime.utcnow)
    is_paid = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='salaries')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'is_paid': self.is_paid
        }
