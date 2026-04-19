from flask_restful import Resource
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta
from extensions import db
from models.user import User, UserRole
from models.inventory import Inventory
from models.sales import Sale
from models.purchases import Purchase
from models.stock_movement import StockMovement
from utils.helpers import make_response_data

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

# ... (keep all existing blueprint routes: performance_stats, performance_fruit, performance_monthly)

class DashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        if user_id is not None:
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                pass
        user = User.query.get(user_id)
        if not user:
            return make_response_data(False, "User not found.", 404)
        
        if user.role == UserRole.CEO:
            # Redirect to CEO resource logic or call
            return {'message': 'Use /ceo/dashboard for CEO'}
        elif user.role == UserRole.SELLER:
            return SellerDashboardResource().get()
        elif user.role == UserRole.PURCHASER:
            return PurchaserDashboardResource().get()
        elif user.role == UserRole.STOREKEEPER:
            return StorekeeperDashboardResource().get()
        return make_response_data(False, "Role not recognized.", 403)

class SellerDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id)) if isinstance(user_id, str) else User.query.get(user_id)
        if not user or user.role != UserRole.SELLER:
            return make_response_data(False, "Access denied.", 403)

        # Personal sales stats
        total_sales = Sale.query.filter_by(seller_id=user.id).count()
        total_revenue = db.session.query(func.sum(Sale.amount)).filter_by(seller_id=user.id).scalar() or 0
        
        # Recent sales (last 10)
        recent_sales = Sale.query.filter_by(seller_id=user.id).order_by(Sale.date.desc()).limit(10).all()
        recent_sales_data = [sale.to_dict() for sale in recent_sales]
        
        # Fruits sold summary
        fruit_sales = db.session.query(
            Sale.fruit_name,
            func.count(Sale.id),
            func.sum(Sale.amount)
        ).filter_by(seller_id=user.id).group_by(Sale.fruit_name).all()
        fruits_data = [{'fruit': f[0], 'count': f[1], 'revenue': f[2] or 0} for f in fruit_sales]

        data = {
            'totalSalesRecords': total_sales,
            'totalRevenue': f"{total_revenue:,.2f} KES",
            'recentSales': recent_sales_data,
            'fruitsSoldSummary': fruits_data
        }
        return make_response_data(data=data, message="Seller dashboard data fetched.")

class PurchaserDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id)) if isinstance(user_id, str) else User.query.get(user_id)
        if not user or user.role != UserRole.PURCHASER:
            return make_response_data(False, "Access denied.", 403)

        # Personal purchases stats
        total_purchases = Purchase.query.filter_by(purchaser_id=user.id).count()
        total_spent = db.session.query(func.sum(Purchase.cost)).filter_by(purchaser_id=user.id).scalar() or 0
        
        # Recent purchases
        recent_purchases = Purchase.query.filter_by(purchaser_id=user.id).order_by(Purchase.purchase_date.desc()).limit(10).all()
        recent_purchases_data = [p.to_dict() for p in recent_purchases]
        
        # Fruits purchased summary
        fruit_purchases = db.session.query(
            Purchase.fruit_type,
            func.count(Purchase.id),
            func.sum(Purchase.cost)
        ).filter_by(purchaser_id=user.id).group_by(Purchase.fruit_type).all()
        fruits_data = [{'fruit': f[0], 'count': f[1], 'cost': f[2] or 0} for f in fruit_purchases]

        data = {
            'totalPurchases': total_purchases,
            'totalSpent': f"{total_spent:,.2f} KES",
            'recentPurchases': recent_purchases_data,
            'fruitsPurchasedSummary': fruits_data
        }
        return make_response_data(data=data, message="Purchaser dashboard data fetched.")

class StorekeeperDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id)) if isinstance(user_id, str) else User.query.get(user_id)
        if not user or user.role != UserRole.STOREKEEPER:
            return make_response_data(False, "Access denied.", 403)

        # Inventory summary
        total_items = Inventory.query.count()
        low_stock = Inventory.query.filter(Inventory.quantity < 10).count()
        total_quantity = db.session.query(func.sum(Inventory.quantity)).scalar() or 0
        
        # Low stock items
        low_stock_items = Inventory.query.filter(Inventory.quantity < 10).order_by(Inventory.quantity).limit(10).all()
        low_stock_data = [item.to_dict() for item in low_stock_items]
        
        # Recent stock movements
        recent_movements = StockMovement.query.order_by(StockMovement.created_at.desc()).limit(10).all()
        movements_data = [m.to_dict() for m in recent_movements]

        data = {
            'totalInventoryItems': total_items,
            'lowStockCount': low_stock,
            'totalQuantity': total_quantity,
            'lowStockItems': low_stock_data,
            'recentStockMovements': movements_data
        }
        return make_response_data(data=data, message="Storekeeper dashboard data fetched.")

# Keep existing performance routes...
# (performance_stats, performance_fruit, performance_monthly unchanged)
