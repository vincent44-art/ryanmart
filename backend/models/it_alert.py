from backend.extensions import db
from datetime import datetime
from enum import Enum


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ITAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_ids = db.Column(db.JSON, nullable=False)  # List of event IDs related to this alert
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    severity = db.Column(db.Enum(AlertSeverity), nullable=False)
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_by = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_to = db.Column(db.String(120), nullable=True)
    suggested_actions = db.Column(db.JSON, nullable=True)  # List of suggested remediation steps

    def to_dict(self):
        return {
            'id': self.id,
            'event_ids': self.event_ids,
            'title': self.title,
            'description': self.description,
            'severity': self.severity.value,
            'acknowledged': self.acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z',
            'assigned_to': self.assigned_to,
            'suggested_actions': self.suggested_actions
        }
