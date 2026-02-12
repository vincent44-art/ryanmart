from flask_restful import Resource, reqparse
from extensions import db
from models.spolige import Spolige
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from datetime import datetime
import logging

logger = logging.getLogger('spolige')

parser = reqparse.RequestParser()
parser.add_argument('fruit_name', type=str, required=True)
parser.add_argument('quantity', type=float, required=True)
parser.add_argument('stage', type=str, required=True)
parser.add_argument('amount_per_kg', type=float, required=True)
parser.add_argument('total_amount', type=float, required=True)
parser.add_argument('description', type=str, required=False)
parser.add_argument('date', type=str, required=True)

class SpoligeResource(Resource):
    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def get(self):
        """Get all spolige records"""
        try:
            spolige_records = Spolige.query.order_by(Spolige.date.desc()).all()
            data = [record.to_dict() for record in spolige_records]
            return make_response_data(
                data=data,
                message="Spolige records fetched successfully."
            )
        except Exception as e:
            logger.error(f"Error fetching spolige records: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Error fetching spolige records: {str(e)}",
                status_code=500
            )

    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def post(self):
        """Create a new spolige record"""
        try:
            data = parser.parse_args()
            current_user = get_current_user()
            
            if not current_user:
                return make_response_data(
                    success=False,
                    message="Authentication required. Please log in again.",
                    status_code=401
                )
            
            try:
                spolige_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return make_response_data(
                    success=False,
                    message="Invalid date format. Use YYYY-MM-DD.",
                    status_code=400
                )
            
            spolige = Spolige(
                fruit_name=data['fruit_name'],
                quantity=data['quantity'],
                stage=data['stage'],
                amount_per_kg=data['amount_per_kg'],
                total_amount=data['total_amount'],
                description=data.get('description'),
                date=spolige_date
            )
            db.session.add(spolige)
            db.session.commit()
            
            spolige_data = spolige.to_dict()
            return make_response_data(
                data=spolige_data,
                message="Spolige record added successfully.",
                status_code=201
            )
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating spolige record: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Failed to create spolige record: {str(e)}",
                status_code=500
            )

class SpoligeItemResource(Resource):
    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def get(self, spolige_id):
        """Get a single spolige record by ID"""
        try:
            spolige = Spolige.query.get(spolige_id)
            if not spolige:
                return make_response_data(
                    success=False,
                    message="Spolige record not found.",
                    status_code=404
                )
            return make_response_data(
                data=spolige.to_dict(),
                message="Spolige record fetched successfully."
            )
        except Exception as e:
            logger.error(f"Error fetching spolige record: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Error fetching spolige record: {str(e)}",
                status_code=500
            )

    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def put(self, spolige_id):
        """Update an existing spolige record"""
        try:
            spolige = Spolige.query.get(spolige_id)
            if not spolige:
                return make_response_data(
                    success=False,
                    message="Spolige record not found.",
                    status_code=404
                )
            
            data = request.get_json()
            if not data:
                return make_response_data(
                    success=False,
                    message="No data provided for update.",
                    status_code=400
                )
            
            # Update fields
            if 'fruit_name' in data:
                spolige.fruit_name = data['fruit_name']
            if 'quantity' in data:
                spolige.quantity = float(data['quantity'])
            if 'stage' in data:
                spolige.stage = data['stage']
            if 'amount_per_kg' in data:
                spolige.amount_per_kg = float(data['amount_per_kg'])
            if 'total_amount' in data:
                spolige.total_amount = float(data['total_amount'])
            if 'description' in data:
                spolige.description = data['description']
            if 'date' in data:
                try:
                    spolige.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                except ValueError:
                    return make_response_data(
                        success=False,
                        message="Invalid date format. Use YYYY-MM-DD.",
                        status_code=400
                    )
            
            db.session.commit()
            
            return make_response_data(
                data=spolige.to_dict(),
                message="Spolige record updated successfully."
            )
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating spolige record: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Failed to update spolige record: {str(e)}",
                status_code=500
            )

    @role_required('ceo', 'seller', 'driver', 'storekeeper', 'purchaser', 'admin', 'it')
    def delete(self, spolige_id):
        """Delete a spolige record"""
        try:
            spolige = Spolige.query.get(spolige_id)
            if not spolige:
                return make_response_data(
                    success=False,
                    message="Spolige record not found.",
                    status_code=404
                )
            
            db.session.delete(spolige)
            db.session.commit()
            
            return make_response_data(
                success=True,
                message="Spolige record deleted successfully."
            )
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting spolige record: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Failed to delete spolige record: {str(e)}",
                status_code=500
            )

class ClearSpoligeResource(Resource):
    @role_required('ceo', 'admin')
    def delete(self):
        """Clear all spolige records (CEO/Admin only)"""
        try:
            count = Spolige.query.count()
            if count == 0:
                return make_response_data(
                    success=False,
                    message="No spolige records to clear.",
                    status_code=400
                )
            
            Spolige.query.delete()
            db.session.commit()
            
            return make_response_data(
                success=True,
                message=f"Successfully cleared {count} spolige record(s)."
            )
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error clearing spolige records: {str(e)}", exc_info=True)
            return make_response_data(
                success=False,
                message=f"Failed to clear spolige records: {str(e)}",
                status_code=500
            )

