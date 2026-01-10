from flask_restful import Resource, reqparse
from sqlalchemy import or_
from extensions import db
from models.message import Message
from models.user import UserRole
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required

parser = reqparse.RequestParser()
parser.add_argument('message', type=str, required=True)
parser.add_argument('recipient_role', type=str, choices=[r.value for r in UserRole])
parser.add_argument('recipient_id', type=int)

class MessageListResource(Resource):
    @role_required('ceo', 'storekeeper', 'seller', 'purchaser', 'driver')
    def get(self):
        current_user = get_current_user()
        messages = Message.query.filter(
            or_(
                Message.recipient_id == current_user.id,
                Message.recipient_role == current_user.role
            )
        ).order_by(Message.created_at.desc()).all()
        return make_response_data(data=[m.to_dict() for m in messages], message="Messages fetched.")

    @role_required('ceo', 'storekeeper', 'seller', 'purchaser', 'driver')
    def post(self):
        data = parser.parse_args()
        current_user = get_current_user()

        if not data.get('recipient_role') and not data.get('recipient_id'):
            return make_response_data(success=False, message="Either recipient_role or recipient_id is required.", status_code=400)

        new_message = Message(
            sender_id=current_user.id,
            message=data['message'],
            recipient_role=UserRole(data['recipient_role']) if data.get('recipient_role') else None,
            recipient_id=data.get('recipient_id')
        )
        db.session.add(new_message)
        db.session.commit()
        return make_response_data(data=new_message.to_dict(), message="Message sent.", status_code=201)

class MessageResource(Resource):
    @role_required('ceo', 'storekeeper', 'seller', 'purchaser', 'driver')
    def put(self, message_id): # Mark as read
        current_user = get_current_user()
        message = Message.query.get_or_404(message_id)

        # Ensure user is the recipient before marking as read
        if message.recipient_id == current_user.id or message.recipient_role == current_user.role:
            message.is_read = True
            db.session.commit()
            return make_response_data(data=message.to_dict(), message="Message marked as read.")
        else:
            return make_response_data(success=False, message="You are not the recipient of this message.", status_code=403)

class ClearMessagesResource(Resource):
    @role_required('ceo')
    def delete(self):
        num_deleted = Message.query.delete()
        db.session.commit()
        return make_response_data(message=f"Successfully cleared {num_deleted} messages.")