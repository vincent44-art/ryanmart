from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required
from models.user import db, User, UserRole
from utils.decorators import role_required
from utils.helpers import make_response_data
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

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

class UsersForSalaryResource(Resource):
    """Resource to fetch users for salary dropdown - accessible by any authenticated user."""
    @jwt_required()
    def get(self):
        users = User.query.filter_by(is_active=True).order_by(User.name).all()
        return make_response_data(data=[user.to_dict() for user in users], message="Users fetched for salary.")

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
        try:
            result = db.session.execute(text("SELECT name FROM \"user\" WHERE id = :user_id"), {"user_id": user_id}).fetchone()
        except Exception as e:
            logger.error(f"Database error checking user existence: {e}")
            return make_response_data(success=False, message=f"Database error: {str(e)}", status_code=500)

        if not result:
            return make_response_data(success=False, message="User not found.", status_code=404)

        user_name = result[0]

        try:
            # Expunge any tracked User object from session to prevent cascade delete issues
            # This prevents SQLAlchemy from trying to lazy-load related records during commit
            user = db.session.get(User, user_id)
            if user:
                db.session.expunge(user)

            # Helper function to check if a table exists and delete records
            # Uses a separate transaction for each table to prevent cascading transaction abort
            def safe_delete(table_name, user_field="user_id"):
                try:
                    # First check if table exists
                    result = db.session.execute(
                        text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"),
                        {"table_name": table_name}
                    ).scalar()
                    if result:
                        db.session.execute(
                            text(f'DELETE FROM {table_name} WHERE {user_field} = :user_id'),
                            {"user_id": user_id}
                        )
                        # Commit after each table deletion to avoid transaction abort propagation
                        db.session.commit()
                except Exception as e:
                    # Rollback on error and start fresh transaction for next table
                    try:
                        db.session.rollback()
                    except:
                        pass
                    logger.warning(f"Could not delete from {table_name}: {e}")
                    # Ignore errors for tables that might not exist or have issues
                finally:
                    # Ensure we're in a clean transaction state for next operation
                    try:
                        if db.session.transaction:
                            db.session.rollback()
                    except:
                        pass

            # Delete related records using raw SQL - with safe handling for optional tables
            # Core tables that should always exist - handle together
            try:
                db.session.execute(text("DELETE FROM sale WHERE seller_id = :user_id"), {"user_id": user_id})
                db.session.execute(text("DELETE FROM purchase WHERE purchaser_id = :user_id"), {"user_id": user_id})
                db.session.execute(text("DELETE FROM other_expenses WHERE user_id = :user_id"), {"user_id": user_id})
                db.session.execute(text("DELETE FROM message WHERE recipient_id = :user_id"), {"user_id": user_id})
            except Exception as e:
                logger.error(f"Error deleting from core tables: {e}")
                raise

            # Optional tables - might not exist in all environments
            # Each safe_delete call handles its own transaction/rollback
            safe_delete("it_event")
            safe_delete("assignment", "seller_id")
            safe_delete("salary")
            safe_delete("seller_fruit", "created_by")
            safe_delete("stock_movement", "added_by")
            safe_delete("inventory", "added_by")
            safe_delete("message", "sender_id")

            # Start a fresh transaction for the main user deletion
            try:
                db.session.rollback()  # Clean up any pending transaction
            except:
                pass

            # Delete the user
            db.session.execute(text("DELETE FROM \"user\" WHERE id = :user_id"), {"user_id": user_id})
            db.session.commit()
            logger.info(f"User {user_name} (ID: {user_id}) deleted successfully")
            return make_response_data(message=f"User {user_name} deleted successfully.")

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting user {user_id}: {e}")
            # If foreign key constraints prevent deletion, set user to inactive instead
            try:
                db.session.execute(
                    text("UPDATE \"user\" SET is_active = false WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                db.session.commit()
                return make_response_data(
                    success=True,
                    message=f"User {user_name} has been deactivated (could not delete due to existing records)."
                )
            except Exception as deactivate_error:
                db.session.rollback()
                logger.error(f"Error deactivating user {user_id}: {deactivate_error}")
                return make_response_data(
                    success=False,
                    message=f"Error deleting user: {str(e)}. Also failed to deactivate: {str(deactivate_error)}",
                    status_code=500
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