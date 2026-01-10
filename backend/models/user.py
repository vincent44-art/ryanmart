from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum
from datetime import datetime


class UserRole(Enum):
    CEO = "ceo"
    STOREKEEPER = "storekeeper"
    SELLER = "seller"
    PURCHASER = "purchaser"
    DRIVER = "driver"
    IT = "it"
    ADMIN = "admin"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.SELLER)
    name = db.Column(db.String(100), nullable=False)
    salary = db.Column(db.Float, default=0.0)
    is_paid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_first_login = db.Column(db.Boolean, default=True)  # Flag for first login password change
    profile_image = db.Column(db.String(256), nullable=True)  # Path or URL to profile image

    # Relationships
    sales = db.relationship('Sale', back_populates='seller', lazy=True, cascade="all, delete-orphan")
    purchases = db.relationship('Purchase', backref='purchaser', lazy=True, cascade="all, delete-orphan")
    inventory_items = db.relationship('Inventory', backref='added_by_user', lazy=True)
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy=True)
    received_messages = db.relationship('Message', foreign_keys='Message.recipient_id', backref='recipient', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role.value,
            'name': self.name,
            'salary': self.salary,
            'is_paid': self.is_paid,
            'is_active': self.is_active,
            'is_first_login': self.is_first_login,
            'created_at': self.created_at.isoformat(),
            'profile_image': self.profile_image
        }
