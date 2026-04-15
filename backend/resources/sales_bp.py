from flask import Blueprint
from flask_restful import Api
from .sales import SaleListResource, SaleResource, SaleSummaryResource, ClearSalesResource, SaleByEmailResource, CustomerDebtResource

sales_bp = Blueprint('sales', __name__, url_prefix='/api/sales')
api = Api(sales_bp)

# Register all sales resources
api.add_resource(SaleListResource, '/')
api.add_resource(SaleByEmailResource, '/email/<string:email>')
api.add_resource(SaleResource, '/<int:sale_id>')
api.add_resource(SaleSummaryResource, '/summary')
api.add_resource(ClearSalesResource, '/clear')
api.add_resource(CustomerDebtResource, '/debts')

# Export blueprint for registration in __init__.py
__all__ = ['sales_bp']

