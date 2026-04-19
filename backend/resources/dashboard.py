from flask_restful import Resource
from sqlalchemy import func
from extensions import db
from models.user import User, UserRole
from models.inventory import Inventory
from models.sales import Sale
from models.purchases import Purchase
from models.stock_movement import StockMovement
from utils.helpers import make_response_data, get_current_user
from utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, jsonify
from datetime import datetime, timedelta
import calendar

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

class DashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        # Convert string ID back to int for SQLAlchemy query.get()
        if user_id is not None:
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                pass
        user = User.query.get(user_id)
        if not user:
            return make_response_data(False, "User not found.", 404)
        
        if user.role == UserRole.CEO:
            data = {
                "total_users": User.query.count(),
                "total_inventory_items": Inventory.query.count(),
                "total_revenue": db.session.query(func.sum(Sale.amount)).scalar() or 0,
                "total_cost": db.session.query(func.sum(Purchase.cost)).scalar() or 0,
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

        elif user.role == UserRole.PURCHASER:
            # Placeholder for purchaser
            data = {"message": "Purchaser dashboard"}
            return make_response_data(data=data)

        elif user.role == UserRole.STOREKEEPER:
            # Placeholder for storekeeper
            data = {"message": "Storekeeper dashboard"}
            return make_response_data(data=data)

        return make_response_data(False, "Role not recognized.", 403)

# NEW CLASSES TO FIX IMPORT ERROR
class SellerDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != UserRole.SELLER:
            return make_response_data(False, "Access denied for seller dashboard.", 403)

        total_sales = Sale.query.filter_by(seller_id=user.id).count()
        total_revenue = db.session.query(func.sum(Sale.amount)).filter(Sale.seller_id == user.id).scalar() or 0
        
        recent_sales = Sale.query.filter_by(seller_id=user.id).order_by(Sale.date.desc()).limit(10).all()
        recent_sales_data = [sale.to_dict() for sale in recent_sales]

        fruit_sales = db.session.query(
            Sale.fruit_name,
            func.count(Sale.id).label('count'),
            func.sum(Sale.amount).label('revenue')
        ).filter(Sale.seller_id == user.id).group_by(Sale.fruit_name).all()

        fruits_data = [{'fruit': fs[0], 'count': fs[1], 'revenue': float(fs[2] or 0)} for fs in fruit_sales]

        data = {
            'stats': {
                'totalSalesRecords': total_sales,
                'totalRevenue': f"{total_revenue:,.2f} KES"
            },
            'recentSales': recent_sales_data,
            'topFruits': fruits_data[:5]  # Top 5 fruits
        }
        return make_response_data(data=data, message="Seller dashboard loaded successfully.")

class PurchaserDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != UserRole.PURCHASER:
            return make_response_data(False, "Access denied for purchaser dashboard.", 403)

        total_purchases = Purchase.query.filter_by(purchaser_id=user.id).count()
        total_spent = db.session.query(func.sum(Purchase.cost)).filter(Purchase.purchaser_id == user.id).scalar() or 0
        
        recent_purchases = Purchase.query.filter_by(purchaser_id=user.id).order_by(Purchase.purchase_date.desc()).limit(10).all()
        recent_purchases_data = [p.to_dict() for p in recent_purchases]

        fruit_purchases = db.session.query(
            Purchase.fruit_type,
            func.count(Purchase.id).label('count'),
            func.sum(Purchase.cost).label('cost')
        ).filter(Purchase.purchaser_id == user.id).group_by(Purchase.fruit_type).all()

        fruits_data = [{'fruit': fp[0], 'count': fp[1], 'cost': float(fp[2] or 0)} for fp in fruit_purchases]

        data = {
            'stats': {
                'totalPurchases': total_purchases,
                'totalSpent': f"{total_spent:,.2f} KES"
            },
            'recentPurchases': recent_purchases_data,
            'topFruits': fruits_data[:5]
        }
        return make_response_data(data=data, message="Purchaser dashboard loaded successfully.")

class StorekeeperDashboardResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != UserRole.STOREKEEPER:
            return make_response_data(False, "Access denied for storekeeper dashboard.", 403)

        total_items = Inventory.query.count()
        low_stock_count = Inventory.query.filter(Inventory.quantity < 10).count()
        total_quantity = db.session.query(func.sum(Inventory.quantity)).scalar() or 0

        low_stock_items = Inventory.query.filter(Inventory.quantity < 10).order_by(Inventory.quantity.asc()).limit(10).all()
        low_stock_data = [item.to_dict() for item in low_stock_items]

        recent_movements = StockMovement.query.order_by(StockMovement.created_at.desc()).limit(10).all()
        movements_data = [m.to_dict() for m in recent_movements]

        data = {
            'stats': {
                'totalItems': total_items,
                'lowStockCount': low_stock_count,
                'totalQuantity': float(total_quantity)
            },
            'lowStockAlerts': low_stock_data,
            'recentMovements': movements_data
        }
        return make_response_data(data=data, message="Storekeeper dashboard loaded successfully.")
