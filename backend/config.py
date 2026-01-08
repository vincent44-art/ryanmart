import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Require DATABASE_URL from environment; remove sqlite fallback.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
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

