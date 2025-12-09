from . import db

class Gradient(db.Model):
    def to_dict(self):
        return {
            'id': self.id,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'name': self.name,
            'description': self.description,
            'fruit_type': self.fruit_type,
            'gradient_type': self.gradient_type,
            'notes': self.notes,
            'quantity': self.quantity,
            'unit': self.unit,
            'purpose': self.purpose
        }
    __tablename__ = 'gradients'
    id = db.Column(db.Integer, primary_key=True)
    application_date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    fruit_type = db.Column(db.String(50), nullable=False)
    gradient_type = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.String(255))
    quantity = db.Column(db.String(50))
    unit = db.Column(db.String(20))
    purpose = db.Column(db.String(100))
