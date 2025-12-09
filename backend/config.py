import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Build SQLALCHEMY_DATABASE_URI from environment variables when DATABASE_URL is not provided.
    # Support either a full DATABASE_URL or individual DB_USER/DB_PASSWORD/DB_HOST/DB_NAME variables.
    _env_db_url = os.environ.get('DATABASE_URL')
    if not _env_db_url:
        db_user = os.environ.get('DB_USER')
        db_password = os.environ.get('DB_PASSWORD')
        db_host = os.environ.get('DB_HOST')
        db_name = os.environ.get('DB_NAME')
        if db_user and db_password and db_host and db_name:
            # Quote the password to safely include special characters
            password_quoted = quote_plus(db_password)
            _env_db_url = f"mysql+pymysql://{db_user}:{password_quoted}@{db_host}/{db_name}"

    SQLALCHEMY_DATABASE_URI = _env_db_url or 'sqlite:///' + os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instance', 'fruittrack.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    # JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Configure CORS origins. In production set CORS_ORIGINS as a comma-separated
    # environment variable, e.g. CORS_ORIGINS=https://app.example.com,https://admin.example.com
    _cors_env = os.environ.get('CORS_ORIGINS')
    if _cors_env:
        CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
    else:
        CORS_ORIGINS = ["http://localhost:3000"]

    # IT Alert Rules
    ALERT_RULES = {
        'failed_login_burst': {
            'condition': '>=5 failed_login from same IP within 15m',
            'severity': 'critical',
            'actions': ['block_ip', 'force_password_reset']
        },
        'mass_data_export': {
            'condition': '>1GB data export by non-admin',
            'severity': 'high',
            'actions': ['alert_it_team']
        },
        'api_error_burst': {
            'condition': '>=10 api_error within 5m',
            'severity': 'warning',
            'actions': ['review_api_usage']
        },
        'permission_change': {
            'condition': 'any permission_change',
            'severity': 'info',
            'actions': ['log_audit']
        }
    }

