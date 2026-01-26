from flask import Blueprint, jsonify
from flask_restful import Api, Resource

# Import all resource classes
from .user import UserListResource, UserResource, UserSalaryResource, UserPaymentResource
from .inventory import InventoryListResource, InventoryResource, ClearInventoryResource

from .purchases import (
    purchases_bp,  # <-- Import blueprint with extra routes
    PurchaseListResource, PurchaseResource,
    ClearPurchasesResource, PurchaseSummaryResource, PurchaseByEmailResource
)
from .stock import StockMovementListResource, ClearStockMovementsResource
from .expenses import OtherExpensesResource, CarExpensesResource
from .other_expenses import OtherExpenseResource
from .salaries import SalariesResource, SalaryResource, SalaryPaymentToggleStatusResource
from .gradients import GradientListResource, ClearGradientsResource
from .messages import MessageListResource, MessageResource, ClearMessagesResource
from .dashboard import CEODashboardResource, SellerDashboardResource, PurchaserDashboardResource, StorekeeperDashboardResource
from .clear_all import ClearAllDataResource
from .profile_image import ProfileImageUploadResource
from .seller_fruits import SellerFruitListResource, SellerFruitResource
from .sales import SaleListResource, SaleResource, ClearSalesResource, SaleSummaryResource


class CurrentStockResource(Resource):
    """Resource to get current stock inventory."""
    def get(self):
        from models.inventory import Inventory
        # Query all inventory items
        items = Inventory.query.all()
        data = []
        for item in items:
            data.append({
                "fruitType": item.fruit_type,
                "quantity": item.quantity,
                "unit": item.unit or "kg"
            })
        return {
            'success': True,
            'data': data
        }


# =====================================================================
# MAIN API BLUEPRINT
# =====================================================================
# All routes under this blueprint are prefixed with /api when registered in app.py
api_bp = Blueprint('api', __name__)
api = Api(api_bp, catch_all_404s=False)  # We handle 404s in app.py

# =====================================================================
# ROUTE REGISTRATIONS
# IMPORTANT: All routes here are relative to /api prefix
# =====================================================================

# ----------- AUTHENTICATION ROUTES -----------
# NOTE: Auth routes are registered in app.py to avoid duplicate registration

# ----------- USER MANAGEMENT -----------
api.add_resource(UserListResource, '/users')
api.add_resource(UserResource, '/users/<int:user_id>')
api.add_resource(UserSalaryResource, '/users/<int:user_id>/salary')
api.add_resource(UserPaymentResource, '/users/<int:user_id>/payment')

# ----------- INVENTORY -----------
api.add_resource(InventoryListResource, '/inventory')
api.add_resource(InventoryResource, '/inventory/<int:inv_id>')
api.add_resource(ClearInventoryResource, '/inventory/clear')

# ----------- STOCK MOVEMENTS -----------
api.add_resource(StockMovementListResource, '/stock-movements')
api.add_resource(ClearStockMovementsResource, '/stock-movements/clear')

# ----------- EXPENSES -----------
api.add_resource(OtherExpensesResource, '/other_expenses')
api.add_resource(OtherExpenseResource, '/other_expenses/<int:expense_id>')
# CarExpensesResource registered in app.py to handle both endpoints

# ----------- SALARIES -----------
api.add_resource(SalariesResource, '/salaries')
api.add_resource(SalaryPaymentToggleStatusResource, '/salary-payments/<int:payment_id>/toggle-status')

# ----------- PURCHASES -----------
api.add_resource(PurchaseListResource, '/purchases')
api.add_resource(PurchaseResource, '/purchases/<int:purchase_id>')
api.add_resource(PurchaseByEmailResource, '/purchases/by-email')
api.add_resource(ClearPurchasesResource, '/purchases/clear')
api.add_resource(PurchaseSummaryResource, '/purchases/summary')

# ----------- GRADIENTS -----------
api.add_resource(GradientListResource, '/gradients')
api.add_resource(ClearGradientsResource, '/gradients/clear')

# ----------- MESSAGES -----------
api.add_resource(MessageListResource, '/messages')
api.add_resource(MessageResource, '/messages/<int:message_id>')
api.add_resource(ClearMessagesResource, '/messages/clear')

# ----------- DASHBOARDS -----------
api.add_resource(CEODashboardResource, '/ceo/dashboard')
api.add_resource(SellerDashboardResource, '/seller/dashboard')
api.add_resource(PurchaserDashboardResource, '/purchaser/dashboard')
api.add_resource(StorekeeperDashboardResource, '/storekeeper/dashboard')

# ----------- CLEAR ALL DATA -----------
api.add_resource(ClearAllDataResource, '/clear-all')

# ----------- SALES -----------
api.add_resource(SaleListResource, '/sales')
api.add_resource(SaleResource, '/sales/<int:sale_id>')
api.add_resource(ClearSalesResource, '/sales/clear')
api.add_resource(SaleSummaryResource, '/sales/summary')

# ----------- EXTRA ROUTES (from purchases.py) -----------
# This ensures /api/purchases/<email> and /api/ceo/messages work
api_bp.register_blueprint(purchases_bp, url_prefix='/api')

# =====================================================================
# NOTE: The catch-all route has been REMOVED from here.
# 404 handling is now done in backend/app.py to ensure proper JSON responses
# for all API endpoints that don't exist.
# =====================================================================

