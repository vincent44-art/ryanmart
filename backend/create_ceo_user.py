from extensions import db
from models.user import User, UserRole
from werkzeug.security import generate_password_hash
from app import create_app

app = create_app()
app.app_context().push()

def add_ceo():
    ceo_email = "ceo@ryanmart.com"
    ceo_password = "password123"
    existing = User.query.filter_by(email=ceo_email).first()
    if not existing:
        ceo = User(
            name="CEO",
            email=ceo_email,
            role=UserRole.CEO,
            is_active=True
        )
        ceo.set_password(ceo_password)
        db.session.add(ceo)
        db.session.commit()
        print(f"Added CEO user: {ceo_email}")
    else:
        print(f"User {ceo_email} already exists.")

if __name__ == "__main__":
    add_ceo()
