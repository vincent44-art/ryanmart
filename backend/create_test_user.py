
if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from backend.app import app, db
    from backend.models.user import User, UserRole

    with app.app_context():
        # Create CEO user if not exists
        ceo = User.query.filter_by(email='ceo@fruittrack.com').first()
        if not ceo:
            ceo = User(
                email='ceo@fruittrack.com',
                name='CEO User',
                role=UserRole.CEO
            )
            ceo.set_password('password123')
            db.session.add(ceo)
            db.session.commit()
            print('CEO user created: ceo@fruittrack.com / password123')
        else:
            print('CEO user already exists.')

        # Create a test seller user if not exists
        user = User.query.filter_by(email='test@example.com').first()
        if not user:
            user = User(
                email='test@example.com',
                name='Test User',
                role=UserRole.SELLER
            )
            user.set_password('test123')
            db.session.add(user)
            db.session.commit()
            print('Test user created: test@example.com / test123')
        else:
            print('Test user already exists.')

with app.app_context():
    # Create CEO user if not exists
    ceo = User.query.filter_by(email='ceo@fruittrack.com').first()
    if not ceo:
        ceo = User(
            email='ceo@fruittrack.com',
            name='CEO User',
            role=UserRole.CEO
        )
        ceo.set_password('password123')
        db.session.add(ceo)
        db.session.commit()
        print('CEO user created: ceo@fruittrack.com / password123')
    else:
        print('CEO user already exists.')

    # Create a test seller user if not exists
    user = User.query.filter_by(email='test@example.com').first()
    if not user:
        user = User(
            email='test@example.com',
            name='Test User',
            role=UserRole.SELLER
        )
        user.set_password('test123')
        db.session.add(user)
        db.session.commit()
        print('Test user created: test@example.com / test123')
    else:
        print('Test user already exists.')
