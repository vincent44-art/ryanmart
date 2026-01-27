from flask_restful import Resource, reqparse
from datetime import datetime
from flask_jwt_extended import jwt_required
from extensions import db
from models.stock_movement import StockMovement
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from sqlalchemy import text

stock_parser = reqparse.RequestParser()
stock_parser.add_argument('inventory_id', type=int, required=True)
stock_parser.add_argument('movement_type', type=str, required=True)
stock_parser.add_argument('quantity', type=str, required=True)
stock_parser.add_argument('unit', type=str)
stock_parser.add_argument('remaining_stock', type=str)
stock_parser.add_argument('date', type=str, required=True)
stock_parser.add_argument('notes', type=str)

class StockMovementListResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Use raw SQL to fetch stock movements as strings to avoid numeric type conversion issues
            movements_result = db.session.execute(text("SELECT id, inventory_id, movement_type, quantity::text, unit, remaining_stock::text, date, notes, selling_price::text, added_by, created_at FROM stock_movement ORDER BY date DESC")).fetchall()
            # Convert to dict-like objects for compatibility
            movements = []
            for row in movements_result:
                movement_dict = {
                    'id': row[0],
                    'inventory_id': row[1],
                    'movement_type': row[2],
                    'quantity': row[3],
                    'unit': row[4],
                    'remaining_stock': row[5],
                    'date': row[6],
                    'notes': row[7],
                    'selling_price': row[8],
                    'added_by': row[9],
                    'created_at': row[10]
                }
                movements.append(type('MovementObj', (), movement_dict)())
        except Exception as e:
            db.session.rollback()
            return make_response_data(success=False, message=f"Error fetching stock movements: {str(e)}", status_code=500)

        return make_response_data(data=[m.to_dict() for m in movements], message="Stock movements fetched.")

    from flask_jwt_extended import jwt_required

    @jwt_required()
    def post(self):
        data = stock_parser.parse_args()
        current_user = get_current_user()
        if not current_user:
            return make_response_data(success=False, message="Authentication required.", status_code=401)
        try:
            move_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)
        new_movement = StockMovement(
            inventory_id=data['inventory_id'],
            movement_type=data['movement_type'],
            quantity=data['quantity'],
            unit=data['unit'],
            remaining_stock=data['remaining_stock'],
            date=move_date,
            notes=data.get('notes'),
            added_by=current_user.id
        )
        db.session.add(new_movement)
        db.session.commit()
        return make_response_data(data=new_movement.to_dict(), message="Stock movement recorded.", status_code=201)

class ClearStockMovementsResource(Resource):
    @role_required('ceo')
    def delete(self):
        num_deleted = StockMovement.query.delete()
        db.session.commit()
        return make_response_data(message=f"Successfully cleared {num_deleted} stock movement records.")