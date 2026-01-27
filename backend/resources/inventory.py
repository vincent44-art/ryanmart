from flask_restful import Resource, reqparse
from datetime import datetime
from extensions import db
from models.inventory import Inventory
from models.stock_movement import StockMovement
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from sqlalchemy import text

parser = reqparse.RequestParser()
parser.add_argument('name', type=str, required=True)
parser.add_argument('quantity', type=str, required=True)
parser.add_argument('fruit_type', type=str, required=True)
parser.add_argument('unit', type=str)
parser.add_argument('location', type=str)
parser.add_argument('expiry_date', type=str)

class InventoryListResource(Resource):
    @role_required('ceo', 'storekeeper')
    def get(self):
        try:
            # Use raw SQL to fetch inventory as strings to avoid numeric type conversion issues
            inventory_result = db.session.execute(text("SELECT id, name, quantity::text, fruit_type, unit, location, expiry_date, purchase_price::text, purchase_date, added_by, created_at FROM inventory ORDER BY created_at DESC")).fetchall()
            # Convert to dict-like objects for compatibility
            inventory = []
            for row in inventory_result:
                item_dict = {
                    'id': row[0],
                    'name': row[1],
                    'quantity': row[2],
                    'fruit_type': row[3],
                    'unit': row[4],
                    'location': row[5],
                    'expiry_date': row[6],
                    'purchase_price': row[7],
                    'purchase_date': row[8],
                    'added_by': row[9],
                    'created_at': row[10]
                }
                inventory.append(type('InventoryObj', (), item_dict)())
        except Exception as e:
            db.session.rollback()
            return make_response_data(success=False, message=f"Error fetching inventory: {str(e)}", status_code=500)

        return make_response_data(data=[item.to_dict() for item in inventory], message="Inventory fetched.")

    @role_required('storekeeper')
    def post(self):
        data = parser.parse_args()
        current_user = get_current_user()

        expiry_date = None
        if data.get('expiry_date'):
            try:
                expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                return make_response_data(success=False, message="Invalid date format for expiry_date. Use YYYY-MM-DD.", status_code=400)

        new_item = Inventory(
            name=data['name'],
            quantity=data['quantity'],
            fruit_type=data['fruit_type'],
            unit=data['unit'],
            location=data['location'],
            expiry_date=expiry_date,
            added_by=current_user.id
        )
        db.session.add(new_item)
        db.session.commit()
        return make_response_data(data=new_item.to_dict(), message="Inventory item added.", status_code=201)

class InventoryResource(Resource):
    @role_required('storekeeper')
    def put(self, inv_id):
        item = Inventory.query.get_or_404(inv_id)
        data = parser.parse_args()
        
        item.name = data['name']
        item.quantity = data['quantity']
        item.fruit_type = data['fruit_type']
        item.unit = data.get('unit', item.unit)
        item.location = data.get('location', item.location)
        if data.get('expiry_date'):
            item.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        
        db.session.commit()
        return make_response_data(data=item.to_dict(), message="Inventory item updated.")

    @role_required('storekeeper')
    def delete(self, inv_id):
        item = Inventory.query.get_or_404(inv_id)
        db.session.delete(item)
        db.session.commit()
        return make_response_data(message="Inventory item deleted.")

class ClearInventoryResource(Resource):
    @role_required('ceo')
    def delete(self):
        try:
            # Must delete movements first due to foreign key constraints
            StockMovement.query.delete()
            num_deleted = Inventory.query.delete()
            db.session.commit()
            return make_response_data(message=f"Successfully cleared {num_deleted} inventory items and their movements.")
        except Exception as e:
            db.session.rollback()
            return make_response_data(success=False, message="Failed to clear inventory.", errors=[str(e)], status_code=500)