from flask_restful import Resource
from backend.extensions import db
from backend.models.sales import Sale
from backend.models.purchases import Purchase
from backend.models.inventory import Inventory
from backend.models.stock_movement import StockMovement
from backend.models.salary import Salary
from backend.models.other_expense import OtherExpense
from backend.models.message import Message
from backend.models.gradient import Gradient
from backend.models.user import User
from backend.utils.helpers import make_response_data
from backend.utils.decorators import role_required

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
