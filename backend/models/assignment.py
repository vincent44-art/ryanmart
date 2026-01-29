from datetime import datetime
from extensions import db

class Assignment(db.Model):
    __tablename__ = 'assignments'
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seller_email = db.Column(db.String(120), nullable=False)
    fruit_type = db.Column(db.String(80), nullable=False)
    assignment_id = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'seller_id': self.seller_id,
            'seller_email': self.seller_email,
            'fruit_type': self.fruit_type,
            'assignment_id': self.assignment_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
