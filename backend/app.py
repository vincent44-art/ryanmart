# EVENTLET MONKEY PATCHING - MUST BE FIRST!
try:
    import eventlet
    _EVENTLET_AVAILABLE = True
except Exception:
    eventlet = None
    _EVENTLET_AVAILABLE = False

import os
import sys
import logging
import time
from flask import Flask, jsonify, send_from_directory, request, current_app, make_response
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta
from werkzeug.security import generate_password_hash

# Ensure backend package is importable
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from config import Config
from extensions import db
from models.user import User, UserRole
from utils.helpers import make_response_data
from utils.it_monitor import log_api_error
from resources import api_bp
from resources.dashboard import dashboard_bp
from resources.__init__ import CurrentStockResource
from resources.purchases import purchases_bp
from resources.ceo_dashboard import CEODashboardResource
from resources.auth import LoginResource, RefreshResource, MeResource, ChangePasswordResource
from flask_restful import Api

# Load environment variables
load_dotenv()

# Path to your React build folder
FRONTEND_BUILD_DIR = os.path.abspath(os.path.join(BACKEND_ROOT, '..', 'frontend', 'build'))


def ensure_database_initialized(app):
    with app.app_context():
        max_retries = 8
        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                app.logger.debug(f"DB init attempt {attempt}/{max_retries}: testing connection...")
                db.session.execute(text('SELECT 1'))
                db.create_all()

                default_email = os.environ.get("DEFAULT_ADMIN_EMAIL", "ceo@ryanmart.com")
                default_password = os.environ.get("DEFAULT_ADMIN_PASSWORD", "ChangeMe123!")

                existing = User.query.filter_by(email=default_email).first()
                if not existing:
                    role_val = getattr(UserRole, "CEO", None) or getattr(UserRole, "ADMIN", None) or "CEO"
                    user = User(
                        email=default_email,
                        name="CEO",
                        role=role_val,
                        password_hash=generate_password_hash(default_password),
                        is_active=True,
                    )
                    db.session.add(user)
                    db.session.commit()
                    app.logger.info(f"Seeded default admin user: {default_email}")

                app.logger.info("Database initialization completed")
                break
            except OperationalError as oe:
                app.logger.warning(f"Database OperationalError on attempt {attempt}: {oe}")
                if attempt == max_retries:
                    app.logger.exception("Max retries reached - database not available")
                    break
                time.sleep(delay)
                delay = min(delay * 2, 30)
            except Exception as e:
                app.logger.exception(f"Database initialization error: {e}")
                break


def create_app(config_class=Config):
    """Create and configure the Flask application."""
    
    # Initialize extensions
    jwt = JWTManager()
    migrate = Migrate()
    
    # Create Flask app with proper static configuration
    app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/static')
    app.config.from_object(config_class)
    
    # Get database URL and strip "DATABASE_URL=" prefix if present
    database_url = os.environ.get("DATABASE_URL", "")
    if database_url.startswith("DATABASE_URL="):
        database_url = database_url[len("DATABASE_URL="):]
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config['DEBUG'] = False
    
    # Avoid Werkzeug automatic redirects for trailing-slash mismatches
    app.url_map.strict_slashes = False
    
    # Enable full error logging for debugging
    logging.basicConfig(level=logging.DEBUG)

    # JWT Expiry
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    # Initialize Extensions with app
    db.init_app(app)
    jwt.init_app(app)

    # JWT user lookup loader
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data.get("sub")
        if not identity:
            return None
        return User.query.get(identity)

    migrate.init_app(app, db)
    
    # =====================================================================
    # CORS CONFIGURATION - SINGLE SOURCE OF TRUTH
    # =====================================================================
    # Get allowed origins from config, with fallbacks for development
    configured_origins = app.config.get('CORS_ORIGINS', [])
    
    # Production URLs - MUST match exactly what's deployed
    PRODUCTION_FRONTEND = "https://ryanmart-fronntend.onrender.com"
    PRODUCTION_BACKEND = "https://ryanmart-backend.onrender.com"
    DEVELOPMENT_LOCALHOST = ["http://localhost:3000", "http://localhost:5173"]
    
    if configured_origins:
        # Use configured origins
        allowed_origins = configured_origins
        app.logger.info(f"Using configured CORS origins: {allowed_origins}")
    else:
        # Default to production frontend for production, localhost for dev
        if os.environ.get('FLASK_ENV') == 'production':
            allowed_origins = [PRODUCTION_FRONTEND]
            app.logger.info(f"Production mode - using frontend origin: {PRODUCTION_FRONTEND}")
        else:
            allowed_origins = DEVELOPMENT_LOCALHOST
            app.logger.info(f"Development mode - using localhost origins: {allowed_origins}")
    
    # Store for reference
    app.config['CORS_ORIGINS'] = allowed_origins
    
    # Initialize Flask-CORS with SIMPLE, CLEAN configuration
    CORS(app, 
         origins=allowed_origins,
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
         expose_headers=["Content-Length", "X-Requested-With"],
         max_age=86400)  # 24 hours for preflight cache
    
    app.logger.info(f"CORS initialized with origins: {allowed_origins}")
    # =====================================================================

    # JWT error handlers - ALL RETURN JSON
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False, 
            'message': 'The token has expired', 
            'error': 'token_expired',
            'status_code': 401
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False, 
            'message': 'Invalid token', 
            'error': 'invalid_token',
            'status_code': 401
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False, 
            'message': 'Missing access token', 
            'error': 'authorization_required',
            'status_code': 401
        }), 401

    @jwt.needs_fresh_token_loader
    def fresh_token_required_callback(error):
        return jsonify({
            'success': False,
            'message': 'Fresh token required',
            'error': 'fresh_token_required',
            'status_code': 401
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        return jsonify({
            'success': False,
            'message': 'Token has been revoked',
            'error': 'token_revoked',
            'status_code': 401
        }), 401

    # =====================================================================
    # API SETUP
    # =====================================================================
    api = Api(app, catch_all_404s=False)  # We handle 404s ourselves

    # Register Blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(purchases_bp, url_prefix='/api')
    from resources.assignments import assignments_bp
    app.register_blueprint(assignments_bp)
    app.register_blueprint(dashboard_bp)
    from resources.drivers import drivers_bp
    app.register_blueprint(drivers_bp)
    
    # Import and register resources
    from resources.other_expenses import OtherExpensesResource, OtherExpenseResource, OtherExpensesPDFResource
    from resources.salaries import SalariesResource, SalaryResource, SalaryPaymentToggleStatusResource
    from resources.expenses import CarExpensesResource
    from resources.user import UserListResource
    from resources.profile_image import ProfileImageUploadResource
    from resources.inventory import InventoryListResource, InventoryResource, ClearInventoryResource
    from resources.stock import StockMovementListResource
    from resources.it_events import ITEventsResource, ITEventResource, ITAcknowledgeAlertsResource
    from resources.it_alerts import ITAlertsResource, ITIncidentsResource
    from resources.sales import SaleListResource, SaleResource, SaleSummaryResource, DailySalesReportResource, ClearSalesResource, CustomerDebtResource, CustomerDebtReportResource
    from resources.purchases import DailyPurchasesReportResource
    from resources.ai_assistance import AIAssistanceResource
    from resources.receipts import ReceiptResource
    from resources.seller_fruits import SellerFruitListResource, SellerFruitResource
    from resources.seller_fruits_bulk import SellerFruitBulkResource
    from resources.stock_tracking import (
        StockTrackingAggregatedResource, StockTrackingListResource, 
        ClearStockTrackingResource, StockTrackingPDFResource, 
        StockTrackingGroupPDFResource, StockTrackingUnmovedPDFResource, 
        StockTrackingCombinedPDFResource
    )

    # Add all API resources with consistent /api prefix
    api.add_resource(LoginResource, '/api/auth/login')
    api.add_resource(RefreshResource, '/api/auth/refresh')
    api.add_resource(MeResource, '/api/auth/me')
    api.add_resource(ChangePasswordResource, '/api/auth/change-password')
    api.add_resource(CurrentStockResource, '/api/current-stock')
    api.add_resource(OtherExpensesResource, '/api/other_expenses', '/api/expenses/other')
    api.add_resource(OtherExpenseResource, '/api/other_expenses/<int:expense_id>')
    api.add_resource(OtherExpensesPDFResource, '/api/other-expenses/pdf')
    api.add_resource(CEODashboardResource, '/api/ceo/dashboard')
    api.add_resource(SalariesResource, '/api/salaries')
    api.add_resource(SalaryResource, '/api/salaries/<int:salary_id>')
    api.add_resource(SalaryPaymentToggleStatusResource, '/api/salary-payments/<int:payment_id>/toggle-status')
    api.add_resource(CarExpensesResource, '/api/car-expenses', '/api/car-expenses/<int:expense_id>')
    api.add_resource(UserListResource, '/api/users')
    api.add_resource(ProfileImageUploadResource, '/api/profile-image')
    api.add_resource(ITEventsResource, '/api/it/events')
    api.add_resource(ITEventResource, '/api/it/events/<string:event_id>')
    api.add_resource(ITAcknowledgeAlertsResource, '/api/it/alerts/acknowledge')
    api.add_resource(ITAlertsResource, '/api/it/alerts')
    api.add_resource(ITIncidentsResource, '/api/it/incidents')
    api.add_resource(SaleListResource, '/api/sales')
    api.add_resource(SaleResource, '/api/sales/<int:sale_id>')
    api.add_resource(SaleSummaryResource, '/api/sales/summary')
    api.add_resource(ClearSalesResource, '/api/sales/clear')
    api.add_resource(CustomerDebtResource, '/api/sales/debts')
    api.add_resource(DailySalesReportResource, '/api/sales/report/<string:date_str>')
    api.add_resource(CustomerDebtReportResource, '/api/sales/debts/<string:customer_email>/report')
    api.add_resource(DailyPurchasesReportResource, '/api/purchases/report/<string:date_str>')
    api.add_resource(AIAssistanceResource, '/api/ai-assistance')
    api.add_resource(ReceiptResource, '/api/receipts', '/api/receipts/<string:receipt_num>')
    api.add_resource(SellerFruitListResource, '/api/seller-fruits')
    api.add_resource(SellerFruitResource, '/api/seller-fruits/<int:fruit_id>')
    api.add_resource(SellerFruitBulkResource, '/api/seller-fruits/bulk')
    api.add_resource(StockTrackingAggregatedResource, '/api/stock-tracking/aggregated')
    api.add_resource(StockTrackingListResource, '/api/stock-tracking')
    api.add_resource(ClearStockTrackingResource, '/api/stock-tracking/clear')
    api.add_resource(StockTrackingPDFResource, '/api/stock-tracking/pdf/<int:record_id>')
    api.add_resource(StockTrackingGroupPDFResource, '/api/stock-tracking/pdf/group')
    api.add_resource(StockTrackingUnmovedPDFResource, '/api/stock-tracking/pdf/unmoved')
    api.add_resource(StockTrackingCombinedPDFResource, '/api/stock-tracking/pdf/combined')
    api.add_resource(InventoryListResource, '/api/inventory')
    api.add_resource(InventoryResource, '/api/inventory/<int:inv_id>')
    api.add_resource(ClearInventoryResource, '/api/inventory/clear')
    api.add_resource(StockMovementListResource, '/api/stock-movements')

    # =====================================================================
    # HEALTH CHECK & DEBUG ROUTES
    # =====================================================================
    @app.route('/api/health')
    def health_check():
        """Health check endpoint - always returns JSON."""
        return jsonify({
            'success': True, 
            'status': 'healthy', 
            'message': 'Service is running', 
            'version': '1.0.0',
            'cors_origins': allowed_origins
        })

    @app.route('/api/_debug/routes')
    def debug_routes():
        """Debug endpoint - list all registered API routes."""
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                routes.append({
                    'methods': sorted(list(rule.methods - {'OPTIONS', 'HEAD'})),
                    'path': rule.rule,
                    'endpoint': rule.endpoint
                })
        return jsonify({
            'success': True,
            'routes': routes,
            'total': len(routes)
        })

    @app.route('/api/_debug/stock-tracking')
    def debug_stock_tracking():
        """Direct debug endpoint for stock tracking - bypasses Flask-RESTful."""
        try:
            from models.stock_tracking import StockTracking
            records = StockTracking.query.order_by(StockTracking.date_in.desc()).limit(10).all()
            data = [record.to_dict() for record in records]
            return jsonify({
                'success': True,
                'data': data,
                'message': 'Stock tracking debug - direct endpoint works!'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error: {str(e)}'
            }), 500

    # =====================================================================
    # STOCK TRACKING DIRECT ROUTES (FALLBACK - bypasses Flask-RESTful)
    # These ensure stock tracking endpoints work even if Flask-RESTful has issues
    # =====================================================================
    @app.route('/api/stock-tracking', methods=['GET', 'POST', 'OPTIONS'])
    def stock_tracking_handler():
        """
        Direct Flask handler for /api/stock-tracking endpoint.
        This is a fallback in case Flask-RESTful routing fails.
        """
        from flask_jwt_extended import jwt_required, get_jwt_identity
        from models.stock_tracking import StockTracking
        from models.user import User
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            resp = make_response('', 204)
            origin = request.headers.get('Origin', '')
            if allowed_origins == ['*'] or origin in allowed_origins:
                resp.headers['Access-Control-Allow-Origin'] = origin or allowed_origins[0] if allowed_origins else '*'
                resp.headers['Access-Control-Allow-Credentials'] = 'true'
                resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            return resp
        
        try:
            # Verify authentication
            identity = get_jwt_identity()
            if not identity:
                return jsonify({
                    'success': False,
                    'message': 'Missing access token',
                    'error': 'authorization_required',
                    'status_code': 401
                }), 401
            
            current_user = User.query.get(identity)
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found',
                    'error': 'user_not_found',
                    'status_code': 401
                }), 401
            
            # Check role for POST (only storekeeper and ceo can create)
            if request.method == 'POST':
                allowed_roles = ['storekeeper', 'ceo', 'admin']
                if current_user.role not in allowed_roles and not any(r in str(current_user.role) for r in allowed_roles):
                    return jsonify({
                        'success': False,
                        'message': 'Insufficient permissions',
                        'error': 'forbidden',
                        'status_code': 403
                    }), 403
            
            # Handle GET request
            if request.method == 'GET':
                records = StockTracking.query.order_by(StockTracking.date_in.desc()).all()
                data = [record.to_dict() for record in records]
                return jsonify({
                    'success': True,
                    'data': data,
                    'message': 'Stock tracking records fetched.'
                })
            
            # Handle POST request
            if request.method == 'POST':
                data = request.get_json() or {}
                
                # Check if this is an update (stock out) by presence of stockInId
                if data.get('stockInId'):
                    # Update existing record for stock out
                    record_id = int(data['stockInId'])
                    record = StockTracking.query.get_or_404(record_id)
                    
                    # Automatically set date_out if not provided or invalid
                    if not data.get('dateOut'):
                        date_out = datetime.now().date()
                    else:
                        try:
                            date_out = datetime.strptime(data['dateOut'], '%Y-%m-%d').date()
                        except ValueError:
                            date_out = datetime.now().date()
                    
                    # Update the record with stock out data
                    record.date_out = date_out
                    record.duration = data.get('duration')
                    record.gradient_used = data.get('gradientUsed')
                    record.gradient_amount_used = data.get('gradientAmountUsed')
                    record.gradient_cost_per_unit = data.get('gradientCostPerUnit')
                    record.total_gradient_cost = data.get('totalGradientCost')
                    record.quantity_out = data.get('quantityOut')
                    record.spoilage = data.get('spoilage')
                    record.total_stock_cost = data.get('totalStockCost')
                    
                    db.session.commit()
                    return jsonify({
                        'success': True,
                        'data': record.to_dict(),
                        'message': 'Stock tracking record updated for stock out.'
                    }), 200
                else:
                    # Create new record for stock in
                    # Automatically set date_in to today if not provided or invalid
                    if not data.get('dateIn'):
                        date_in = datetime.now().date()
                    else:
                        try:
                            date_in = datetime.strptime(data['dateIn'], '%Y-%m-%d').date()
                        except ValueError:
                            date_in = datetime.now().date()
                    
                    # Automatically set date_out to None if not provided or invalid
                    if not data.get('dateOut'):
                        date_out = None
                    else:
                        try:
                            date_out = datetime.strptime(data['dateOut'], '%Y-%m-%d').date()
                        except ValueError:
                            date_out = None
                    
                    record = StockTracking(
                        stock_name=data['stockName'],
                        date_in=date_in,
                        fruit_type=data['fruitType'],
                        quantity_in=data['quantityIn'],
                        amount_per_kg=data.get('amountPerKg', 0),
                        total_amount=data.get('totalAmount', 0),
                        other_charges=data.get('otherCharges', 0),
                        date_out=date_out,
                        duration=data.get('duration'),
                        gradient_used=data.get('gradientUsed'),
                        gradient_amount_used=data.get('gradientAmountUsed'),
                        gradient_cost_per_unit=data.get('gradientCostPerUnit'),
                        total_gradient_cost=data.get('totalGradientCost'),
                        quantity_out=data.get('quantityOut'),
                        spoilage=data.get('spoilage'),
                        total_stock_cost=data.get('totalStockCost'),
                    )
                    db.session.add(record)
                    db.session.commit()
                    return jsonify({
                        'success': True,
                        'data': record.to_dict(),
                        'message': 'Stock tracking record created.'
                    }), 201
                    
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Stock tracking handler error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Error: {str(e)}',
                'error': 'internal_error'
            }), 500

    @app.route('/api/stock-tracking/aggregated', methods=['GET', 'OPTIONS'])
    def stock_tracking_aggregated_handler():
        """
        Direct Flask handler for /api/stock-tracking/aggregated endpoint.
        This is a fallback in case Flask-RESTful routing fails.
        """
        from flask_jwt_extended import jwt_required, get_jwt_identity
        from models.stock_tracking import StockTracking
        from models.user import User
        from models.sales import Sale
        from models.other_expense import OtherExpense
        from models.driver import DriverExpense
        from models.stock_movement import StockMovement
        from models.inventory import Inventory
        from models.purchases import Purchase
        import logging
        import re
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            resp = make_response('', 204)
            origin = request.headers.get('Origin', '')
            if allowed_origins == ['*'] or origin in allowed_origins:
                resp.headers['Access-Control-Allow-Origin'] = origin or allowed_origins[0] if allowed_origins else '*'
                resp.headers['Access-Control-Allow-Credentials'] = 'true'
                resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            return resp
        
        try:
            # Verify authentication
            identity = get_jwt_identity()
            if not identity:
                return jsonify({
                    'success': False,
                    'message': 'Missing access token',
                    'error': 'authorization_required',
                    'status_code': 401
                }), 401
            
            current_user = User.query.get(identity)
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found',
                    'error': 'user_not_found',
                    'status_code': 401
                }), 401
            
            logger = logging.getLogger('stock_tracking')
            logger.info("Fetching aggregated stock tracking data (direct handler)")
            
            # Get all stock tracking records
            stocks = StockTracking.query.all()
            logger.info(f"Found {len(stocks)} stock tracking records")
            
            # Group stocks by stock_name
            stock_groups = {}
            for stock in stocks:
                name = stock.stock_name
                if name not in stock_groups:
                    stock_groups[name] = []
                stock_groups[name].append(stock)
            
            aggregated_data = []
            
            for stock_name, stock_list in stock_groups.items():
                try:
                    # Aggregate basic info
                    fruit_type = stock_list[0].fruit_type
                    total_purchase_cost = sum(stock.total_amount for stock in stock_list)
                    total_quantity_in = sum(stock.quantity_in for stock in stock_list)
                    earliest_date_in = min((stock.date_in for stock in stock_list if stock.date_in), default=None)
                    latest_date_out = max((stock.date_out for stock in stock_list if stock.date_out), default=None)
                    
                    # Calculate storage usage
                    storage_usage = 0
                    try:
                        storage_result = StockMovement.query.join(Inventory).filter(
                            Inventory.name == stock_name,
                            StockMovement.movement_type == 'out'
                        ).with_entities(db.func.sum(StockMovement.quantity)).scalar()
                        storage_usage = float(storage_result) if storage_result else 0
                    except Exception as e:
                        logger.warning(f"Error calculating storage usage for stock {stock_name}: {str(e)}")
                    
                    # Calculate transport costs
                    transport_costs = 0
                    try:
                        transport_result = DriverExpense.query.filter(
                            DriverExpense.stock_name == stock_name
                        ).with_entities(db.func.sum(DriverExpense.amount)).scalar()
                        transport_costs = float(transport_result) if transport_result else 0
                    except Exception as e:
                        logger.warning(f"Error calculating transport costs for stock {stock_name}: {str(e)}")
                    
                    # Calculate other expenses
                    other_expenses = 0
                    try:
                        if earliest_date_in or latest_date_out:
                            stock_date = earliest_date_in or latest_date_out or datetime.now().date()
                            date_start = stock_date - timedelta(days=7)
                            date_end = (latest_date_out or stock_date) + timedelta(days=7)
                        else:
                            date_start = datetime.now().date() - timedelta(days=30)
                            date_end = datetime.now().date() + timedelta(days=30)
                        
                        expense_result = OtherExpense.query.filter(
                            OtherExpense.date >= date_start,
                            OtherExpense.date <= date_end
                        ).with_entities(db.func.sum(OtherExpense.amount)).scalar()
                        other_expenses = float(expense_result) if expense_result else 0
                    except Exception as e:
                        logger.warning(f"Error calculating other expenses for stock {stock_name}: {str(e)}")
                    
                    # Calculate revenue and quantity sold
                    revenue = 0
                    quantity_sold = 0
                    try:
                        date_start = earliest_date_in or datetime.now().date() - timedelta(days=365)
                        date_end = datetime.now().date()
                        sales_query = Sale.query.filter(
                            Sale.stock_name == stock_name,
                            Sale.date >= date_start,
                            Sale.date <= date_end
                        )
                        revenue_result = sales_query.with_entities(db.func.sum(Sale.amount)).scalar()
                        quantity_result = sales_query.with_entities(db.func.sum(Sale.qty)).scalar()
                        revenue = float(revenue_result) if revenue_result else 0
                        quantity_sold = float(quantity_result) if quantity_result else 0
                    except Exception as e:
                        logger.warning(f"Error calculating revenue for stock {stock_name}: {str(e)}")
                    
                    # Calculate profit/loss
                    total_costs = total_purchase_cost + transport_costs + other_expenses
                    profit_loss = revenue - total_costs
                    
                    aggregated_data.append({
                        'stock_name': stock_name,
                        'fruit_type': fruit_type,
                        'purchase_cost': total_purchase_cost,
                        'storage_usage': storage_usage,
                        'transport_costs': transport_costs,
                        'other_expenses': other_expenses,
                        'revenue': revenue,
                        'quantity_sold': quantity_sold,
                        'profit_loss': profit_loss,
                        'date_in': earliest_date_in.isoformat() if earliest_date_in else None,
                        'date_out': latest_date_out.isoformat() if latest_date_out else None,
                        'total_quantity_in': total_quantity_in
                    })
                except Exception as e:
                    logger.error(f"Error processing stock group {stock_name}: {str(e)}")
                    continue
            
            # Calculate fruit profitability
            fruit_profitability = {}
            purchases = Purchase.query.all()
            sales = Sale.query.all()
            
            for purchase in purchases:
                try:
                    fruit = purchase.fruit_type
                    if fruit not in fruit_profitability:
                        fruit_profitability[fruit] = {
                            'fruit_name': fruit,
                            'total_purchased': 0,
                            'total_sold': 0,
                            'total_revenue': 0,
                            'total_costs': 0
                        }
                    
                    quantity_str = str(purchase.quantity).strip()
                    quantity_match = re.search(r'(\d+(\.\d+)?)', quantity_str)
                    quantity = float(quantity_match.group(1)) if quantity_match else 0.0
                    
                    fruit_profitability[fruit]['total_purchased'] += quantity
                    fruit_profitability[fruit]['total_costs'] += float(purchase.cost or 0)
                except Exception as e:
                    logger.error(f"Error processing purchase: {str(e)}")
                    continue
            
            # Aggregate sales
            try:
                from models.seller_fruit import SellerFruit
                sales_records = sales + SellerFruit.query.all()
                for sale in sales_records:
                    try:
                        fruit = sale.fruit_name
                        if fruit not in fruit_profitability:
                            fruit_profitability[fruit] = {
                                'fruit_name': fruit,
                                'total_purchased': 0,
                                'total_sold': 0,
                                'total_revenue': 0,
                                'total_costs': 0
                            }
                        
                        fruit_profitability[fruit]['total_sold'] += float(sale.qty)
                        fruit_profitability[fruit]['total_revenue'] += sale.amount
                    except Exception as e:
                        logger.error(f"Error processing sale: {str(e)}")
                        continue
            except ImportError:
                pass
            
            # Calculate profit margin
            for fruit_data in fruit_profitability.values():
                fruit_data['profit_margin'] = fruit_data['total_revenue'] - fruit_data['total_costs']
            
            return jsonify({
                'success': True,
                'data': {
                    'stock_expenses': aggregated_data,
                    'fruit_profitability': list(fruit_profitability.values())
                },
                'message': 'Aggregated stock tracking data fetched successfully.'
            })
            
        except Exception as e:
            logger = logging.getLogger('stock_tracking')
            logger.error(f"Error fetching aggregated data: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Error fetching aggregated data: {str(e)}'
            }), 500

    @app.route('/api/cors-test')
    def cors_test():
        """CORS test endpoint - returns request headers for debugging."""
        return jsonify({
            'success': True,
            'message': 'CORS test successful',
            'headers': dict(request.headers),
            'origin': request.headers.get('Origin', 'No origin header')
        })

    @app.route('/api/_debug/db')
    def debug_db():
        """Debug DB connectivity - remove in production."""
        try:
            res = db.session.execute(text('SELECT 1')).scalar()
            return jsonify({'ok': True, 'db_response': res})
        except Exception as e:
            current_app.logger.exception('DB connectivity test failed')
            return jsonify({'ok': False, 'error': str(e)}), 500

    # =====================================================================
    # STATIC FILES & REACT SPA
    # =====================================================================
    @app.route('/logo/<path:filename>')
    def serve_logo(filename):
        return send_from_directory(os.path.join(os.getcwd(), 'logo'), filename)

    @app.route('/<path:path>', methods=['GET', 'HEAD'])
    def serve_react(path):
        """
        Serve React frontend for non-API routes only.
        IMPORTANT: This must NOT catch /api/* routes.
        
        CRITICAL FIX: This catch-all MUST NOT intercept any API routes.
        All /api/* requests should be handled by Flask-RESTful and return JSON.
        """
        # =====================================================================
        # API ROUTE DETECTION - MUST CATCH ALL API PATTERNS
        # =====================================================================
        # Check for any API route pattern - these must return JSON, not HTML
        
        # Normalize path - remove leading slash for consistent checking
        normalized_path = path.lstrip('/')
        
        # Pattern 1: Direct /api prefix
        if normalized_path.startswith('api/') or normalized_path == 'api':
            app.logger.warning(f"API route intercepted by catch-all (normalized): /{path}")
            return jsonify({
                'success': False,
                'message': 'API endpoint not found',
                'error': 'not_found',
                'status_code': 404,
                'path': f'/{path}'
            }), 404
        
        # Pattern 2: Double slashes or encoded paths
        if '/' + normalized_path + '/' in request.path or request.path.endswith('/' + normalized_path):
            if normalized_path.startswith('api'):
                app.logger.warning(f"API route intercepted (end check): /{path}")
                return jsonify({
                    'success': False,
                    'message': 'API endpoint not found',
                    'error': 'not_found',
                    'status_code': 404,
                    'path': f'/{path}'
                }), 404
        
        # Pattern 3: Check for stock-tracking specifically (the problematic endpoint)
        if 'stock-tracking' in path.lower():
            app.logger.warning(f"Stock tracking route intercepted by catch-all: /{path}")
            return jsonify({
                'success': False,
                'message': 'API endpoint not found',
                'error': 'not_found',
                'status_code': 404,
                'path': f'/{path}'
            }), 404
        
        # Pattern 4: Any path that looks like an API endpoint
        api_indicators = ['/api/', '/auth/', '/stock', '/sales', '/purchases', '/expenses', '/inventory']
        for indicator in api_indicators:
            if indicator in request.path.lower():
                app.logger.warning(f"API route intercepted (indicator check: {indicator}): /{path}")
                return jsonify({
                    'success': False,
                    'message': 'API endpoint not found',
                    'error': 'not_found',
                    'status_code': 404,
                    'path': f'/{path}'
                }), 404
        
        # =====================================================================
        # NON-API ROUTES - Serve React frontend
        # =====================================================================
        app.logger.info(f"Serving React for path: {path}")
        
        # Check if the path is a file in the build directory
        full_path = os.path.join(FRONTEND_BUILD_DIR, path)
        if os.path.isfile(full_path):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        
        # Check if it's a static asset path
        if path.startswith('static/') or path.startswith('logo/'):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        
        # Otherwise, serve index.html for SPA routing (React Router)
        # Only if path is not empty and not an API call
        if path:
            return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
        
        # Empty path - serve index.html
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')

    # =====================================================================
    # JSON ERROR HANDLERS - ALL API ERRORS RETURN JSON
    # =====================================================================
    
    @app.errorhandler(400)
    def bad_request(error):
        """400 Bad Request - returns JSON."""
        log_api_error(request.path, "Bad request", 400)
        return jsonify({
            'success': False,
            'message': 'Bad request',
            'error': str(error) if error else 'invalid_request',
            'status_code': 400
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        """401 Unauthorized - returns JSON."""
        log_api_error(request.path, "Unauthorized access", 401)
        return jsonify({
            'success': False,
            'message': 'Unauthorized. Please log in.',
            'error': 'authorization_required',
            'status_code': 401
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        """403 Forbidden - returns JSON."""
        log_api_error(request.path, "Forbidden access", 403)
        return jsonify({
            'success': False,
            'message': 'Forbidden. You do not have permission.',
            'error': 'forbidden',
            'status_code': 403
        }), 403

    @app.errorhandler(404)
    def not_found_error(error):
        """404 Not Found - returns JSON for API routes, HTML for others."""
        log_api_error(request.path, "Not found", 404)
        
        # Check if it's an API route - return JSON
        # This check is CRITICAL - must catch all API patterns
        path = request.path
        
        # List of API indicators to check
        api_indicators = ['/api/', '/auth/', '/stock', '/tracking', '/sales', '/purchases', 
                         '/expenses', '/inventory', '/dashboard', '/users', '/it/']
        
        is_api_route = (
            path.startswith('/api') or 
            path == '/api' or
            path.startswith('/auth') or
            any(indicator in path.lower() for indicator in api_indicators)
        )
        
        if is_api_route:
            app.logger.warning(f"API 404 error for path: {path}")
            return jsonify({
                'success': False,
                'message': 'The requested API endpoint was not found.',
                'error': 'not_found',
                'status_code': 404,
                'path': path
            }), 404
        
        # For non-API routes, let the React SPA handle it
        # Check if frontend build exists
        if not os.path.exists(FRONTEND_BUILD_DIR):
            app.logger.error(f"Frontend build directory not found: {FRONTEND_BUILD_DIR}")
            return jsonify({
                'success': False,
                'message': 'Frontend not built. API only mode.',
                'error': 'frontend_not_available',
                'status_code': 200  # Return 200 so frontend shows a message, not an error
            }), 200
        
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')

    @app.errorhandler(405)
    def method_not_allowed(error):
        """405 Method Not Allowed - returns JSON."""
        log_api_error(request.path, "Method not allowed", 405)
        return jsonify({
            'success': False,
            'message': 'The HTTP method is not allowed for this endpoint.',
            'error': 'method_not_allowed',
            'status_code': 405
        }), 405

    @app.errorhandler(500)
    def internal_error(error):
        """500 Internal Server Error - returns JSON."""
        db.session.rollback()
        log_api_error(request.path, "Internal server error", 500)
        return jsonify({
            'success': False,
            'message': 'An internal server error occurred.',
            'error': 'internal_server_error',
            'status_code': 500
        }), 500

    @app.errorhandler(422)
    def unprocessable_entity(error):
        """422 Unprocessable Entity - returns JSON."""
        log_api_error(request.path, "Unprocessable entity", 422)
        return jsonify({
            'success': False,
            'message': 'The request could not be processed.',
            'error': 'unprocessable_entity',
            'status_code': 422
        }), 422

    @app.errorhandler(413)
    def request_entity_too_large(error):
        """413 Payload Too Large - returns JSON."""
        log_api_error(request.path, "Payload too large", 413)
        return jsonify({
            'success': False,
            'message': 'The request payload is too large.',
            'error': 'payload_too_large',
            'status_code': 413
        }), 413

    # =====================================================================
    # FORCE CORS HEADERS ON ALL API RESPONSES
    # =====================================================================
    @app.after_request
    def add_cors_headers(response):
        """
        Ensure CORS headers are present on all API responses.
        This is a safety net in case Flask-CORS misses any.
        """
        origin = request.headers.get('Origin', '')
        
        # Only add CORS headers for API routes
        if request.path.startswith('/api') or request.path == '/api':
            # Check if origin is allowed
            if allowed_origins == ['*'] or origin in allowed_origins:
                if allowed_origins == ['*']:
                    response.headers['Access-Control-Allow-Origin'] = '*'
                else:
                    response.headers['Access-Control-Allow-Origin'] = origin
                    response.headers['Vary'] = 'Origin'
                
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        
        # Ensure Content-Type is JSON for API responses
        if request.path.startswith('/api') or request.path == '/api':
            if response.content_type == 'application/json' or not response.content_type:
                pass  # Already correct
        
        return response

    # =====================================================================
    # PREFLIGHT OPTIONS HANDLER (fallback)
    # =====================================================================
    @app.route('/api/<path:subpath>', methods=['OPTIONS'])
    def cors_preflight(subpath):
        """
        Handle OPTIONS preflight requests for /api/* routes.
        Flask-CORS should handle this automatically, but this is a fallback.
        """
        origin = request.headers.get('Origin', '')
        
        if allowed_origins == ['*'] or origin in allowed_origins:
            resp = make_response('', 204)
            if allowed_origins == ['*']:
                resp.headers['Access-Control-Allow-Origin'] = '*'
            else:
                resp.headers['Access-Control-Allow-Origin'] = origin
                resp.headers['Vary'] = 'Origin'
            
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            resp.headers['Access-Control-Max-Age'] = '86400'
            return resp
        
        return make_response('', 204)

    # Ensure DB schema exists and seed default admin if missing
    ensure_database_initialized(app)
    return app


# Global app for Gunicorn
app = create_app()


# Local Development
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

