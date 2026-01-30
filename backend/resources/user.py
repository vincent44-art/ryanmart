from flask_restful import Resource, reqparse
from models.user import db, User, UserRole
from utils.decorators import role_required
from utils.helpers import make_response_data
from sqlalchemy import text

parser = reqparse.RequestParser()
parser.add_argument('email', type=str, required=True)
parser.add_argument('password', type=str, required=True)
parser.add_argument('name', type=str, required=True)
parser.add_argument('role', type=str, required=True, choices=[role.value for role in UserRole])
parser.add_argument('salary', type=float)
parser.add_argument('is_active', type=bool)
parser.add_argument('profile_image', type=str)

class UserListResource(Resource):
    @role_required('ceo')
    def get(self):
        users = User.query.order_by(User.id).all()
        return make_response_data(data=[user.to_dict() for user in users], message="All users fetched.")

    @role_required('ceo')
    def post(self):
        data = parser.parse_args()

        if User.query.filter_by(email=data['email']).first():
            return make_response_data(success=False, message="User with this email already exists.", status_code=400)

        # Ensure role is lowercase for Enum compatibility
        role_value = data['role'].lower()
        user = User(
            email=data['email'],
            name=data['name'],
            role=UserRole(role_value),
            salary=data.get('salary', 0.0),
            is_first_login=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return make_response_data(data=user.to_dict(), message="User created successfully.", status_code=201)

class UserResource(Resource):
    @role_required('ceo')
    def put(self, user_id):
        user = User.query.get_or_404(user_id)
        data = parser.parse_args()

        # Check for email conflict
        if User.query.filter(User.email == data['email'], User.id != user_id).first():
            return make_response_data(success=False, message="Another user with this email already exists.", status_code=400)

        user.email = data['email']
        user.name = data['name']
        user.role = UserRole(data['role'])
        user.salary = data.get('salary', user.salary)
        user.is_active = data.get('is_active', user.is_active)
        user.profile_image = data.get('profile_image', user.profile_image)
        
        if data.get('password'):
            user.set_password(data['password'])

        db.session.commit()
        return make_response_data(data=user.to_dict(), message="User updated successfully.")

    @role_required('ceo')
    def delete(self, user_id):
        # Use raw SQL for all operations to avoid ORM numeric type issues
        # First, check if user exists and get name
        result = db.session.execute(text("SELECT name FROM \"user\" WHERE id = :user_id"), {"user_id": user_id}).fetchone()
        if not result:
            return make_response_data(success=False, message="User not found.", status_code=404)

        user_name = result[0]

        try:
            # Expunge any tracked User object from session to prevent cascade delete issues
            # This prevents SQLAlchemy from trying to lazy-load related records during commit
            user = db.session.get(User, user_id)
            if user:
                db.session.expunge(user)
            
            # Delete related records using raw SQL
            db.session.execute(text("DELETE FROM sale WHERE seller_id = :user_id"), {"user_id": user_id})
            db.session.execute(text("DELETE FROM purchase WHERE purchaser_id = :user_id"), {"user_id": user_id})
            db.session.execute(text("DELETE FROM other_expenses WHERE user_id = :user_id"), {"user_id": user_id})
            db.session.execute(text("DELETE FROM inventory WHERE added_by = :user_id"), {"user_id": user_id})
            db.session.execute(text("DELETE FROM message WHERE sender_id = :user_id OR recipient_id = :user_id"), {"user_id": user_id})
            # Delete the user
            db.session.execute(text("DELETE FROM \"user\" WHERE id = :user_id"), {"user_id": user_id})
            db.session.commit()
            return make_response_data(message=f"User {user_name} deleted successfully.")
        except Exception as e:
            db.session.rollback()
            # If foreign key constraints prevent deletion, set user to inactive instead
            db.session.execute(text("UPDATE \"user\" SET is_active = false WHERE id = :user_id"), {"user_id": user_id})
            db.session.commit()
            return make_response_data(
                success=True,
                message=f"User {user_name} has been deactivated (could not delete due to existing records).",
                warning=True
            )

class UserSalaryResource(Resource):
    @role_required('ceo')
    def put(self, user_id):
        parser = reqparse.RequestParser()
        parser.add_argument('salary', type=float, required=True)
        data = parser.parse_args()
        
        user = User.query.get_or_404(user_id)
        user.salary = data['salary']
        db.session.commit()
        return make_response_data(data=user.to_dict(), message="User salary updated.")

class UserPaymentResource(Resource):
    @role_required('ceo')
    def put(self, user_id):
        parser = reqparse.RequestParser()
        parser.add_argument('is_paid', type=bool, required=True)
        data = parser.parse_args()

        user = User.query.get_or_404(user_id)
        user.is_paid = data['is_paid']
        db.session.commit()
        return make_response_data(data=user.to_dict(), message=f"User payment status marked as {'paid' if data['is_paid'] else 'unpaid'}.")