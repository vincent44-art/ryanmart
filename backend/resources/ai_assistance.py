from flask_restful import Resource
from flask import request
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.user import User, UserRole
from backend.models.purchases import Purchase
from backend.models.sales import Sale
from backend.models.driver import DriverExpense
from backend.models.inventory import Inventory
from backend.models.stock_tracking import StockTracking
from ..utils.helpers import make_response_data

class AIAssistanceResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        query = data.get('query', '').lower()

        response = self.process_query(query)

        return make_response_data(data={'response': response}, message='AI assistance response.')

    def process_query(self, query):
        # Simple keyword-based parsing
        if 'user' in query:
            # Extract user name, assume after 'user'
            parts = query.split('user')
            if len(parts) > 1:
                user_name = parts[1].strip()
                user = User.query.filter(User.name.ilike(f'%{user_name}%')).first()
                if user:
                    role = user.role.value if hasattr(user.role, 'value') else user.role
                    response = f"User: {user.name}\nRole: {role}\n"

                    if role == 'purchaser':
                        purchases = Purchase.query.filter_by(purchaser_id=user.id).all()
                        if purchases:
                            response += "Purchases:\n"
                            for p in purchases:
                                response += f"- {p.fruit_type}: {p.quantity} kg at {p.amount_per_kg} KES/kg, Total: {p.cost} KES on {p.purchase_date}\n"
                        else:
                            response += "No purchases found.\n"
                    elif role == 'seller':
                        sales = Sale.query.filter_by(seller_id=user.id).all()
                        if sales:
                            response += "Sales:\n"
                            for s in sales:
                                response += f"- {s.fruit_type}: {s.quantity} kg at {s.price_per_kg if hasattr(s, 'price_per_kg') else 'N/A'} KES/kg, Revenue: {s.revenue} KES on {s.sale_date}\n"
                        else:
                            response += "No sales found.\n"
                    elif role == 'driver':
                        expenses = DriverExpense.query.filter_by(driver_email=user.email).all()
                        if expenses:
                            response += "Driver Expenses:\n"
                            for e in expenses:
                                response += f"- {e.description or e.category}: {e.amount} KES on {e.date}\n"
                        else:
                            response += "No driver expenses found.\n"
                    elif role == 'store_keeper':
                        # For store keeper, perhaps inventory or stock tracking
                        inventory = Inventory.query.filter_by(user_id=user.id).all()
                        stock = StockTracking.query.filter_by(user_id=user.id).all()
                        if inventory:
                            response += "Inventory:\n"
                            for i in inventory:
                                response += f"- {i.fruit_type}: {i.quantity} kg\n"
                        if stock:
                            response += "Stock Tracking:\n"
                            for s in stock:
                                response += f"- {s.fruit_type}: {s.quantity} kg on {s.date}\n"
                        if not inventory and not stock:
                            response += "No inventory or stock data found.\n"
                    else:
                        response += "No specific data for this role.\n"

                    return response
                else:
                    return f"User '{user_name}' not found."
        else:
            return "I'm sorry, I can help with user information. Please ask about a specific user, e.g., 'show me data for user John'."
