from flask_restful import Resource
from extensions import db
from models.sales import Sale
from models.purchases import Purchase
from models.inventory import Inventory
from models.stock_movement import StockMovement
from models.salary import Salary
from models.other_expense import OtherExpense
from models.message import Message
from models.gradient import Gradient
from models.user import User
from utils.helpers import make_response_data
from utils.decorators import role_required

class ClearAllDataResource(Resource):
    @role_required('ceo')
    def delete(self):
        try:
            StockMovement.query.delete()
            Inventory.query.delete()
            Sale.query.delete()
            Purchase.query.delete()
            Salary.query.delete()
            OtherExpense.query.delete()
            Message.query.delete()
            Gradient.query.delete()
            db.session.commit()
            return make_response_data(message="All business data cleared from the database.")
        except Exception as e:
            db.session.rollback()
            return make_response_data(success=False, message="Failed to clear all data.", errors=[str(e)], status_code=500)
