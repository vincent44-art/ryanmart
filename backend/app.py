# EVENTLET MONKEY PATCHING - MUST BE FIRST!
try:
    # Import eventlet if available, but do NOT call monkey_patch() here.
    # Calling eventlet.monkey_patch() at import time can fail when the
    # Flask CLI / Werkzeug have already created thread/request-local
    # objects. Instead, we only detect availability and let Flask-SocketIO
    # choose the async mode. If you need full monkey-patching for a
    # deployment, do it as the very first action before any imports.
    import eventlet
    _EVENTLET_AVAILABLE = True
except Exception:
    eventlet = None
    _EVENTLET_AVAILABLE = False

import os
import sys
import logging
import time
from flask import Flask, jsonify, send_from_directory, request, current_app
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
from resources.ceo_dashboard import CEODashboardResource
from resources.auth import LoginResource, RefreshResource, MeResource, ChangePasswordResource
from flask_restful import Api

# Load environment variables
load_dotenv()

# Path to your React build folder
FRONTEND_BUILD_DIR = os.path.join(BACKEND_ROOT, '..', 'frontend', 'build')

# Flask-SocketIO removed for this deployment; real-time features are disabled.


def ensure_database_initialized(app):
    with app.app_context():
        max_retries = 8
        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                # Try a lightweight connection check first
                app.logger.debug(f"DB init attempt {attempt}/{max_retries}: testing connection...")
                db.session.execute(text('SELECT 1'))

                # Create all tables if they do not exist
                db.create_all()

                # Seed a default CEO/admin user if missing
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
                # Handle network/interface errors from other drivers
                # Unexpected exception: log and break
                app.logger.exception(f"Database initialization error: {e}")
                break


def create_app(config_class=Config):
    # Initialize extensions INSIDE create_app() to ensure app context
    jwt = JWTManager()
    migrate = Migrate()
    
    app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/')
    app.config.from_object(config_class)
    # Get database URL and strip "DATABASE_URL=" prefix if present (some platforms add this)
    database_url = os.environ.get("DATABASE_URL", "")
    if database_url.startswith("DATABASE_URL="):
        database_url = database_url[len("DATABASE_URL="):]
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config['DEBUG'] = False
    # Avoid Werkzeug automatic redirects for trailing-slash mismatches.
    # This prevents a request to '/auth/login' being redirected to
    # '/auth/login/' (3xx) which would break CORS preflight OPTIONS.
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
    
    # Initialize CORS using configured origins from Config (CORS_ORIGINS).
    # Enforce only the origins provided via the environment variable. If the
    # variable is missing or contains '*' we log a warning; the latter is
    # considered permissive but still honored.
    configured = app.config.get('CORS_ORIGINS')
    # Normalize configured origins: allow either a list or comma-separated string
    if isinstance(configured, str):
        configured = [s.strip() for s in configured.split(',') if s.strip()]

    if not configured:
        app.logger.warning('CORS_ORIGINS is not set. This will allow any origin. Set CORS_ORIGINS env var to restrict allowed origins.')
        allowed_origins = ['*']
    else:
        allowed_origins = configured
        if '*' in allowed_origins:
            app.logger.warning("CORS_ORIGINS contains '*', which is permissive. Consider specifying explicit origin(s) for production.")

    # Apply CORS only to API routes to avoid interfering with static/react routes
    # Persist the normalized list into app.config so handlers can reference it
    app.config['CORS_ORIGINS'] = allowed_origins
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    
    # SocketIO intentionally not initialized in this deployment.

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'success': False, 'message': 'The token has expired', 'error': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'success': False, 'message': 'Invalid token', 'error': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'success': False, 'message': 'Missing access token', 'error': 'authorization_required'}), 401

    # API setup
    api = Api(app, catch_all_404s=True)

    # Register Blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    from resources.assignments import assignments_bp
    app.register_blueprint(assignments_bp)
    app.register_blueprint(dashboard_bp)
    from resources.drivers import drivers_bp
    app.register_blueprint(drivers_bp)
    # NOTE: removed /auth and /auth/<path> redirect routes to avoid
    # accidental 3xx responses during CORS preflight. Only the canonical
    # /api/auth/* routes are served below (see api.add_resource entries).
    from resources.other_expenses import OtherExpensesResource, OtherExpenseResource, OtherExpensesPDFResource
    from resources.salaries import SalariesResource, SalaryResource, SalaryPaymentToggleStatusResource
    from resources.expenses import CarExpensesResource
    from resources.user import UserListResource
    from resources.profile_image import ProfileImageUploadResource
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
    api.add_resource(StockTrackingAggregatedResource, '/api/stock_tracking/aggregated')
    api.add_resource(StockTrackingListResource, '/api/stock-tracking')
    api.add_resource(ClearStockTrackingResource, '/api/stock-tracking/clear')
    api.add_resource(StockTrackingPDFResource, '/api/stock-tracking/pdf/<int:record_id>')
    api.add_resource(StockTrackingGroupPDFResource, '/api/stock-tracking/pdf/group')
    api.add_resource(StockTrackingUnmovedPDFResource, '/api/stock-tracking/pdf/unmoved')
    api.add_resource(StockTrackingCombinedPDFResource, '/api/stock-tracking/pdf/combined')

    # Health Check
    @app.route('/api/health')
    def health_check():
        return jsonify({'success': True, 'status': 'healthy', 'message': 'Service is running', 'version': '1.0.0'})

    # Debug: quick DB connectivity test (remove in production if you prefer)
    @app.route('/api/_debug/db')
    def debug_db():
        try:
            # simple scalar query to verify DB connection
            res = db.session.execute(text('SELECT 1')).scalar()
            return jsonify({'ok': True, 'db_response': res})
        except Exception as e:
            current_app.logger.exception('DB connectivity test failed')
            return jsonify({'ok': False, 'error': str(e)}), 500

    # CORS Test Route
    @app.route('/api/cors-test')
    def cors_test():
        return jsonify({
            'success': True,
            'headers': dict(request.headers),
            'message': 'CORS test route',
        })

    # Serve logo
    @app.route('/logo/<path:filename>')
    def serve_logo(filename):
        return send_from_directory(os.path.join(os.getcwd(), 'logo'), filename)

    # Serve React frontend for all non-API routes
    @app.route('/', defaults={'path': ''}, methods=['GET', 'HEAD'])
    @app.route('/<path:path>', methods=['GET', 'HEAD'])
    def serve_react(path):
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

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        log_api_error(request.path, "Internal server error", 500)
        return make_response_data(success=False, message="An internal server error occurred.", errors=[str(error)], status_code=500)

    @app.errorhandler(401)
    def unauthorized_error(error):
        log_api_error(request.path, "Unauthorized access", 401)
        return make_response_data(success=False, message="Unauthorized.", errors=[str(error)], status_code=401)

    @app.errorhandler(403)
    def forbidden_error(error):
        log_api_error(request.path, "Forbidden access", 403)
        return make_response_data(success=False, message="Forbidden.", errors=[str(error)], status_code=403)

    # Explicit preflight handler for any /api/* route
    @app.route('/api/<path:subpath>', methods=['OPTIONS'])
    def cors_preflight(subpath):
        origin = request.headers.get('Origin', '')
        allowed = app.config.get('CORS_ORIGINS') or []
        # If no origins configured, treat as permissive (warning already logged above).
        if not allowed:
            resp = app.make_response(('', 204))
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return resp

        # If '*' present explicitly, allow any origin
        if '*' in allowed:
            resp = app.make_response(('', 204))
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return resp

        # Strict-check: only allow configured origins
        if origin in allowed:
            resp = app.make_response(('', 204))
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return resp

        # Not allowed — return without CORS headers (browser will block)
        return ('', 204)

    # Force credentials-enabled CORS headers for API routes
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        allowed = set(app.config.get('CORS_ORIGINS') or ['*'])
        # Only add CORS headers for API routes
        if request.path.startswith('/api'):
            allowed = app.config.get('CORS_ORIGINS') or []
            # If not configured, keep permissive behavior for compatibility
            if not allowed or '*' in allowed:
                response.headers['Access-Control-Allow-Origin'] = '*' if not allowed else '*'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response.headers['Access-Control-Allow-Credentials'] = 'true'
            else:
                if origin in allowed:
                    response.headers['Access-Control-Allow-Origin'] = origin
                    response.headers['Vary'] = 'Origin'
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

    # Ensure DB schema exists and seed default admin if missing
    ensure_database_initialized(app)
    return app


# Global app for Gunicorn
app = create_app()


# Local Development
if __name__ == '__main__':
    # Run the Flask development server when executed directly.
    app.run(host='0.0.0.0', port=5000, debug=False)

