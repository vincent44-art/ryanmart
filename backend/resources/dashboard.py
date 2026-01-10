from flask_restful import Resource
from sqlalchemy import func
from extensions import db
from models.user import User, UserRole
from models.inventory import Inventory
from models.sales import Sale
from models.purchases import Purchase
from ..utils.helpers import make_response_data, get_current_user
from ..utils.decorators import role_required


from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, jsonify

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/stats')
def stats():
    """Real stats from database"""
    total_users = User.query.count()
    total_sales = Sale.query.count()
    total_revenue = db.session.query(func.sum(Sale.amount)).scalar() or 0

    return jsonify({
        "users": total_users,
        "sales": total_sales,
        "revenue": total_revenue
    })

@dashboard_bp.route('/api/performance/stats')
def performance_stats():
    """Real performance stats from database"""
    current_month = datetime.now().strftime('%B')
    total_sales = Sale.query.count()
    total_revenue = db.session.query(func.sum(Sale.amount)).scalar() or 0

    return jsonify({
        "month": current_month,
        "total_sales": total_sales,
        "total_revenue": total_revenue
    })

@dashboard_bp.route('/api/performance/fruit')
def performance_fruit():
    """Real fruit performance from database"""
    fruit_performance = db.session.query(
        Sale.fruit_name,
        func.count(Sale.id).label('count'),
        func.sum(Sale.amount).label('total_revenue')
    ).group_by(Sale.fruit_name).all()

    result = {}
    for fruit, count, revenue in fruit_performance:
        result[fruit] = {
            "count": count,
            "revenue": revenue or 0
        }

    return jsonify(result)

@dashboard_bp.route('/api/performance/monthly')
def performance_monthly():
    """Real monthly performance from database"""
    monthly_data = db.session.query(
        func.strftime('%Y-%m', Sale.date).label('month'),
        func.count(Sale.id).label('sales'),
        func.sum(Sale.amount).label('revenue')
    ).group_by(func.strftime('%Y-%m', Sale.date)).all()

    result = []
    for month, sales, revenue in monthly_data:
        result.append({
            "month": month,
            "sales": sales,
            "revenue": revenue or 0
        })

    return jsonify(result)

# class DashboardResource(Resource):
#     @jwt_required()
#     def get(self):
#         user = User.query.get(get_jwt_identity())
#         if not user:
#             return make_response_data(False, "User not found.", 404)
        
#         if user.role == UserRole.CEO:
#             return CEODashboardResource().get()
#         elif user.role == UserRole.SELLER:
#             return SellerDashboardResource().get()
#         elif user.role == UserRole.PURCHASER:
#             return PurchaserDashboardResource().get()
#         elif user.role == UserRole.STOREKEEPER:
#             return StorekeeperDashboardResource().get()
#         else:
#             return make_response_data(False, "Role not recognized.", 403)
class DashboardResource(Resource):
    @jwt_required()
    def get(self):
        user = User.query.get(get_jwt_identity())
        if not user:
            return make_response_data(False, "User not found.", 404)
        
        if user.role == UserRole.CEO:
            # CEO data
            total_users = User.query.count()
            total_inventory_items = Inventory.query.count()
            total_revenue = db.session.query(func.sum(Sale.amount)).scalar() or 0
            total_cost = db.session.query(func.sum(Purchase.cost)).scalar() or 0
            data = {
                "total_users": total_users,
                "total_inventory_items": total_inventory_items,
                "total_revenue": f"{total_revenue:,.2f} KES",
                "total_cost": f"{total_cost:,.2f} KES",
                "net_profit": f"{(total_revenue - total_cost):,.2f} KES"
            }
            return make_response_data(data=data, message="CEO dashboard data fetched.")

        elif user.role == UserRole.SELLER:
            total_sales = Sale.query.filter_by(seller_id=user.id).count()
            total_revenue = db.session.query(func.sum(Sale.amount)).filter(Sale.seller_id == user.id).scalar() or 0
            data = {
                "my_total_sales_records": total_sales,
                "my_total_revenue": f"{total_revenue:,.2f} KES"
            }
            return make_response_data(data=data, message="Seller dashboard data fetched.")

        # Add Purchaser & Storekeeper here similarly...

        return make_response_data(False, "Role not recognized.", 403)


class CEODashboardResource(Resource):
    @role_required('ceo')
    def get(self):
        total_users = User.query.count()
        total_inventory_items = Inventory.query.count()
        total_revenue = db.session.query(func.sum(Sale.amount)).scalar() or 0
        total_cost = db.session.query(func.sum(Purchase.cost)).scalar() or 0

        data = {
            "total_users": total_users,
            "total_inventory_items": total_inventory_items,
            "total_revenue": f"{total_revenue:,.2f} KES",
            "total_cost": f"{total_cost:,.2f} KES",
            "net_profit": f"{(total_revenue - total_cost):,.2f} KES"
        }
        return make_response_data(data=data, message="CEO dashboard data fetched.")

class SellerDashboardResource(Resource):
    @role_required('seller')
    def get(self):
        current_user = get_current_user()
        total_sales = Sale.query.filter_by(seller_id=current_user.id).count()
        total_revenue = db.session.query(func.sum(Sale.amount)).filter(Sale.seller_id == current_user.id).scalar() or 0

        data = {
            "my_total_sales_records": total_sales,
            "my_total_revenue": f"{total_revenue:,.2f} KES"
        }
        return make_response_data(data=data, message="Seller dashboard data fetched.")

class PurchaserDashboardResource(Resource):
    @role_required('purchaser')
    def get(self):
        current_user = get_current_user()
        total_purchases = Purchase.query.filter_by(purchaser_id=current_user.id).count()
        total_cost = db.session.query(func.sum(Purchase.cost)).filter(Purchase.purchaser_id == current_user.id).scalar() or 0

        data = {
            "my_total_purchases": total_purchases,
            "my_total_cost": f"{total_cost:,.2f} KES"
        }
        return make_response_data(data=data, message="Purchaser dashboard data fetched.")

class StorekeeperDashboardResource(Resource):
    @role_required('storekeeper')
    def get(self):
        total_inventory_items = Inventory.query.count()
        
        fruit_counts = db.session.query(
            Inventory.fruit_type, func.count(Inventory.id)
        ).group_by(Inventory.fruit_type).all()
        
        data = {
            "total_inventory_items": total_inventory_items,
            "inventory_breakdown": [{"fruit_type": fruit, "count": count} for fruit, count in fruit_counts]
        }
        return make_response_data(data=data, message="Storekeeper dashboard data fetched.")


