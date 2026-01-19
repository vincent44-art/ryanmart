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
FRONTEND_BUILD_DIR = os.path.join(BACKEND_ROOT, '..', 'frontend', 'build')


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
    PRODUCTION_FRONTEND = "https://ryanmart-frontend.onrender.com"
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

    @app.route('/', defaults={'path': ''}, methods=['GET', 'HEAD'])
    @app.route('/<path:path>', methods=['GET', 'HEAD'])
    def serve_react(path):
        """
        Serve React frontend for non-API routes only.
        IMPORTANT: This must NOT catch /api/* routes.
        """
        # If this is an API route, we should NOT be here - let 404 handler deal with it
        if path.startswith('api/') or path == 'api':
            return jsonify({
                'success': False,
                'message': 'API endpoint not found',
                'error': 'not_found',
                'status_code': 404
            }), 404
        
        app.logger.info(f"Serving React for path: {path}")
        
        # If path is empty, serve index.html
        if not path:
            return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
        
        # Check if the path is a file in the build directory
        full_path = os.path.join(FRONTEND_BUILD_DIR, path)
        if os.path.isfile(full_path):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        
        # Otherwise, serve index.html for SPA routing (React Router)
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
        if request.path.startswith('/api') or request.path == '/api':
            return jsonify({
                'success': False,
                'message': 'The requested API endpoint was not found.',
                'error': 'not_found',
                'status_code': 404,
                'path': request.path
            }), 404
        
        # For non-API routes, let the React SPA handle it
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

