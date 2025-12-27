import os
import sys
from flask import Flask, jsonify, send_from_directory, request
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
from datetime import timedelta

# Ensure project root is on sys.path so `backend.*` imports work
# whether this file is imported as `backend.app` or as top-level `app`.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.config import Config
from backend.extensions import db
from backend.models.user import User, UserRole
from backend.utils.helpers import make_response_data
from backend.utils.it_monitor import log_api_error
from backend.resources import api_bp  # Your API blueprints
from backend.resources.dashboard import dashboard_bp
from backend.resources.__init__ import CurrentStockResource
from backend.resources.ceo_dashboard import CEODashboardResource
from backend.resources.auth import LoginResource, RefreshResource, MeResource, ChangePasswordResource
from flask_restful import Api

# Load environment variables
load_dotenv()

# Path to your React build folder
FRONTEND_BUILD_DIR = os.path.join(os.getcwd(), 'Frontend', 'build')

# Initialize extensions
jwt = JWTManager()
cors = CORS()
migrate = Migrate()
socketio = SocketIO()

def create_app(config_class=Config):
    from backend.resources.user import UserListResource
    from backend.resources.salaries import SalaryPaymentsResource
    app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/')
    app.config.from_object(config_class)
    app.config['DEBUG'] = False  # Always run in production mode for speed

    # CORS setup
    # app.config['CORS_HEADERS'] = 'Content-Type'
    # app.config['CORS_SUPPORTS_CREDENTIALS'] = True
    # app.config['CORS_ORIGINS'] = [
    #     "http://localhost:3000",
    #     "http://127.0.0.1:3000",
    #     "http://localhost:5000",
    #     "http://127.0.0.1:5000"
    # ]
    # Allowed origins — include local dev and deployed frontend domains
    app.config['CORS_ORIGINS'] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://job-tracking-system-frontend.onrender.com",
        "https://job-tracking-system-pdnz.onrender.com",
        "https://ryanmart-frontend.onrender.com",
        "https://ryanmart.store"
    ]
    cors.init_app(
        app,
        resources={r"/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "automatic_options": True
        }}
    )

    # JWT Expiry
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)

    # JWT user lookup loader
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.get(identity)

    # Note: CORS already initialized above with production origins.

    migrate.init_app(app, db)
    # Allow socketio connections from the same set of allowed origins
    socketio.init_app(app, cors_allowed_origins=app.config.get('CORS_ORIGINS', [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]))

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
    api = Api(app)
    api.add_resource(LoginResource, '/api/auth/login')
    api.add_resource(RefreshResource, '/api/auth/refresh')
    api.add_resource(MeResource, '/api/auth/me')
    api.add_resource(ChangePasswordResource, '/api/auth/change-password')
    api.add_resource(CurrentStockResource, '/api/current-stock')
    api.add_resource(OtherExpensesResource, '/api/other_expenses', '/api/expenses/other')
    api.add_resource(OtherExpenseResource, '/api/other_expenses/<int:expense_id>')
    api.add_resource(OtherExpensesPDFResource, '/api/other-expenses/pdf')
    api.add_resource(CEODashboardResource, '/ceo/dashboard')
    api.add_resource(SalariesResource, '/api/salaries')
    api.add_resource(SalaryResource, '/api/salaries/<int:salary_id>')
    api.add_resource(SalaryPaymentsResource, '/api/salary-payments')
    api.add_resource(SalaryPaymentToggleStatusResource, '/api/salary-payments/<int:payment_id>/toggle-status')
    api.add_resource(CarExpensesResource, '/api/car-expenses', '/api/car-expenses/<int:expense_id>')
    api.add_resource(UserListResource, '/api/users')
    from backend.resources.profile_image import ProfileImageUploadResource
    api.add_resource(ProfileImageUploadResource, '/api/profile-image')
    from backend.resources.it_events import ITEventsResource, ITEventResource, ITAcknowledgeAlertsResource
    api.add_resource(ITEventsResource, '/api/it/events')
    api.add_resource(ITEventResource, '/api/it/events/<string:event_id>')
    api.add_resource(ITAcknowledgeAlertsResource, '/api/it/alerts/acknowledge')
    from backend.resources.it_alerts import ITAlertsResource, ITIncidentsResource
    api.add_resource(ITAlertsResource, '/api/it/alerts')
    api.add_resource(ITIncidentsResource, '/api/it/incidents')
    from backend.resources.sales import SaleListResource, SaleResource, SaleSummaryResource, DailySalesReportResource, ClearSalesResource, CustomerDebtResource, CustomerDebtReportResource
    from backend.resources.purchases import DailyPurchasesReportResource
    from backend.resources.ai_assistance import AIAssistanceResource
    from backend.resources.receipts import ReceiptResource
    from backend.resources.seller_fruits import SellerFruitListResource, SellerFruitResource

    api.add_resource(SaleListResource, '/api/sales')
    api.add_resource(SaleResource, '/api/sales/<int:sale_id>')
    api.add_resource(SaleSummaryResource, '/api/sales/summary')
    api.add_resource(ClearSalesResource, '/api/sales/clear')
    api.add_resource(CustomerDebtResource, '/api/sales/debts')
    from backend.resources.seller_fruits_bulk import SellerFruitBulkResource
    from backend.resources.stock_tracking import StockTrackingAggregatedResource, StockTrackingListResource, ClearStockTrackingResource, StockTrackingPDFResource, StockTrackingGroupPDFResource, StockTrackingUnmovedPDFResource, StockTrackingCombinedPDFResource
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
        from flask import request
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
        # If the path starts with 'api/', return 404 so Flask API routes work
        if path.startswith('api/'):
            return make_response_data(False, 404, "API endpoint not found.", [path])
        full_path = os.path.join(FRONTEND_BUILD_DIR, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')

    # Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        log_api_error(request.path, "Resource not found", 404)
        return make_response_data(False, 404, "Resource not found.", [str(error)])

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        log_api_error(request.path, "Internal server error", 500)
        return make_response_data(False, 500, "An internal server error occurred.", [str(error)])

    @app.errorhandler(401)
    def unauthorized_error(error):
        log_api_error(request.path, "Unauthorized access", 401)
        return make_response_data(False, 401, "Unauthorized.", [str(error)])

    @app.errorhandler(403)
    def forbidden_error(error):
        log_api_error(request.path, "Forbidden access", 403)
        return make_response_data(False, 403, "Forbidden.", [str(error)])

    return app

# Global app for Gunicorn
app = create_app()

# Local Development
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
