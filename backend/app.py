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
import logging
from flask import Flask, jsonify, send_from_directory, request
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta
from werkzeug.security import generate_password_hash

from backend.config import Config
from backend.extensions import db
from backend.models.user import User, UserRole
from backend.utils.helpers import make_response_data
from backend.utils.it_monitor import log_api_error
from backend.resources import api_bp
from backend.resources.dashboard import dashboard_bp
from backend.resources.__init__ import CurrentStockResource
from backend.resources.ceo_dashboard import CEODashboardResource
from backend.resources.auth import LoginResource, RefreshResource, MeResource, ChangePasswordResource
from flask_restful import Api

# Load environment variables
load_dotenv()

# Path to your React build folder
FRONTEND_BUILD_DIR = os.path.join(os.getcwd(), 'frontend', 'build')

# Initialize SocketIO at module level BEFORE create_app() to avoid NameError
socketio = SocketIO(cors_allowed_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://ryanmart-frontend.onrender.com",
    "https://ryanmart.store"
])


def ensure_database_initialized(app):
    with app.app_context():
        try:
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
        except Exception as e:
            app.logger.error(f"Database initialization error: {e}")


def create_app(config_class=Config):
    # Initialize extensions INSIDE create_app() to ensure app context
    jwt = JWTManager()
    migrate = Migrate()
    
    app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/')
    app.config.from_object(config_class)
    app.config['DEBUG'] = False
    
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
    
    # Initialize CORS for REST API
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "https://ryanmart-frontend.onrender.com",
                "https://ryanmart.store"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    }, supports_credentials=True)
    
    socketio.init_app(app, cors_allowed_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://ryanmart-frontend.onrender.com",
        "https://ryanmart.store"
    ])

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
    from backend.resources.assignments import assignments_bp
    app.register_blueprint(assignments_bp)
    app.register_blueprint(dashboard_bp)
    from backend.resources.drivers import drivers_bp
    app.register_blueprint(drivers_bp)
    from backend.resources.other_expenses import OtherExpensesResource, OtherExpenseResource, OtherExpensesPDFResource
    from backend.resources.salaries import SalariesResource, SalaryResource, SalaryPaymentToggleStatusResource
    from backend.resources.expenses import CarExpensesResource
    from backend.resources.user import UserListResource
    from backend.resources.profile_image import ProfileImageUploadResource
    from backend.resources.it_events import ITEventsResource, ITEventResource, ITAcknowledgeAlertsResource
    from backend.resources.it_alerts import ITAlertsResource, ITIncidentsResource
    from backend.resources.sales import SaleListResource, SaleResource, SaleSummaryResource, DailySalesReportResource, ClearSalesResource, CustomerDebtResource, CustomerDebtReportResource
    from backend.resources.purchases import DailyPurchasesReportResource
    from backend.resources.ai_assistance import AIAssistanceResource
    from backend.resources.receipts import ReceiptResource
    from backend.resources.seller_fruits import SellerFruitListResource, SellerFruitResource
    from backend.resources.seller_fruits_bulk import SellerFruitBulkResource
    from backend.resources.stock_tracking import (
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
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        full_path = os.path.join(FRONTEND_BUILD_DIR, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
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
        allowed_origins = {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://ryanmart-frontend.onrender.com",
            "https://ryanmart.store",
        }
        if origin in allowed_origins:
            response = ('', 204)
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return response
        return ('', 204)

    # Force credentials-enabled CORS headers for API routes
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        allowed_origins = {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://ryanmart-frontend.onrender.com",
            "https://ryanmart.store",
        }
        # Only add CORS headers for API routes and allowed origins
        if request.path.startswith('/api') and origin in allowed_origins:
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
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)

