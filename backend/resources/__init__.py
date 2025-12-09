from flask import Blueprint, jsonify
from flask_restful import Api, Resource

# Import all resource classes
from .auth import LoginResource, MeResource
from .user import UserListResource, UserResource, UserSalaryResource, UserPaymentResource
from .inventory import InventoryListResource, InventoryResource, ClearInventoryResource

from .purchases import (
    purchases_bp,  # <-- Import blueprint with extra routes
    PurchaseListResource, PurchaseResource,
    ClearPurchasesResource, PurchaseSummaryResource
)
from .stock import StockMovementListResource, ClearStockMovementsResource
from .expenses import OtherExpensesResource, CarExpensesResource
from .other_expenses import OtherExpenseResource
from .salaries import SalariesResource, SalaryResource, SalaryPaymentToggleStatusResource
from .gradients import GradientListResource, ClearGradientsResource
from .messages import MessageListResource, MessageResource, ClearMessagesResource
from .dashboard import CEODashboardResource, SellerDashboardResource, PurchaserDashboardResource, StorekeeperDashboardResource
from flask_restful import Resource
from .clear_all import ClearAllDataResource
from .stock_tracking import StockTrackingListResource, ClearStockTrackingResource, StockTrackingAggregatedResource
from .profile_image import ProfileImageUploadResource
from .seller_fruits import SellerFruitListResource, SellerFruitResource
from .sales import SaleListResource, SaleResource, ClearSalesResource, SaleSummaryResource

class CurrentStockResource(Resource):
    def get(self):
        from backend.models.inventory import Inventory
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

# Create main API blueprint
api_bp = Blueprint('api', __name__)
api = Api(api_bp)

# ----------- AUTHENTICATION ROUTES -----------
api.add_resource(LoginResource, '/auth/login')
api.add_resource(MeResource, '/auth/me')

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
api.add_resource(CarExpensesResource, '/car-expenses', endpoint='car_expenses')  # Added to fix frontend 404
api.add_resource(CarExpensesResource, '/drivers/expenses', endpoint='driver_expenses')

# ----------- SALARIES -----------
api.add_resource(SalariesResource, '/api/salaries')
api.add_resource(SalaryPaymentToggleStatusResource, '/api/salary-payments/<int:payment_id>/toggle-status')



# ----------- PURCHASES -----------
api.add_resource(PurchaseListResource, '/purchases')
api.add_resource(PurchaseResource, '/purchases/<int:purchase_id>')
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

# ----------- STOCK TRACKING -----------
api.add_resource(StockTrackingListResource, '/stock-tracking')
api.add_resource(ClearStockTrackingResource, '/stock-tracking/clear')
api.add_resource(StockTrackingAggregatedResource, '/stock-tracking/aggregated')

# ----------- SELLER FRUITS -----------
api.add_resource(SellerFruitListResource, '/seller-fruits')
api.add_resource(SellerFruitResource, '/seller-fruits/<int:fruit_id>')

# ----------- SALES -----------
api.add_resource(SaleListResource, '/sales')
api.add_resource(SaleResource, '/sales/<int:sale_id>')
api.add_resource(ClearSalesResource, '/sales/clear')
api.add_resource(SaleSummaryResource, '/sales/summary')

# ----------- EXTRA ROUTES (from purchases.py) -----------
# This ensures /api/purchases/<email> and /api/ceo/messages work
api_bp.register_blueprint(purchases_bp, url_prefix='')

# ----------- CATCH-ALL (MUST BE LAST) -----------
# Move this to the very end of the file, after all resource registrations
@api_bp.route('/', defaults={'path': ''})
@api_bp.route('/<path:path>')
def catch_all(path):
    return jsonify({
        'success': False,
        'message': 'API endpoint not found',
        'error': 'not_found',
        'status_code': 404
    }), 404
