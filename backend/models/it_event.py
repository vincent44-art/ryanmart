from backend.extensions import db
from datetime import datetime
from enum import Enum


class EventType(Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    FAILED_LOGIN = "failed_login"
    PERMISSION_CHANGE = "permission_change"
    DATA_EXPORT = "data_export"
    FILE_UPLOAD = "file_upload"
    CONFIG_CHANGE = "config_change"
    API_ERROR = "api_error"


class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ITEvent(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_email = db.Column(db.String(120), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    event_type = db.Column(db.Enum(EventType), nullable=False)
    severity = db.Column(db.Enum(Severity), nullable=False)
    ip = db.Column(db.String(45), nullable=True)  # IPv4/IPv6
    device = db.Column(db.String(255), nullable=True)
    resource = db.Column(db.String(255), nullable=True)
    summary = db.Column(db.Text, nullable=False)
    payload = db.Column(db.JSON, nullable=True)
    related_event_ids = db.Column(db.JSON, nullable=True)  # List of related event IDs
    server_logs = db.Column(db.Text, nullable=True)
    stack_trace = db.Column(db.Text, nullable=True)

    # Relationships
    user = db.relationship('User', backref='it_events')

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'user_email': self.user_email,
            'user_id': self.user_id,
            'event_type': self.event_type.value,
            'severity': self.severity.value,
            'ip': self.ip,
            'device': self.device,
            'resource': self.resource,
            'summary': self.summary,
            'payload': self.payload,
            'related_event_ids': self.related_event_ids,
            'server_logs': self.server_logs,
            'stack_trace': self.stack_trace
        }
