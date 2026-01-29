from datetime import datetime
from extensions import db
from models.user import UserRole

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_role = db.Column(db.Enum(UserRole))
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Optional for specific user
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name,
            'recipient_role': self.recipient_role.value if self.recipient_role else None,
            'recipient_id': self.recipient_id,
            'recipient_name': self.recipient.name if self.recipient else 'All ' + self.recipient_role.value.capitalize() + 's',
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }