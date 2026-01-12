import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Read DATABASE_URL from environment. If using a pure-Python driver like
    # pg8000 we ensure SQLAlchemy uses the correct driver name. If DATABASE_URL
    # is not set we fall back to a local sqlite file for easy local development.
    _db_url = os.environ.get('DATABASE_URL')
    if _db_url:
        # Normalize common Heroku/Render-style URLs that start with postgres://
        # SQLAlchemy expects postgresql:// and we want to use the pg8000 driver
        # (pure-Python). Also ensure external hosts use SSL by default if not
        # already specified (Render Postgres requires SSL for external connections).
        from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

        parsed = urlparse(_db_url)
        scheme = parsed.scheme
        netloc = parsed.netloc
        path = parsed.path or ''
        query = parsed.query or ''

        # Replace scheme to use SQLAlchemy dialect + driver
        if scheme in ('postgres', 'postgresql'):
            scheme = 'postgresql+pg8000'

        # If the host looks external (contains a dot) and sslmode not set, add sslmode=require
        qs = parse_qs(query)
        host = parsed.hostname or ''
        if 'sslmode' not in qs:
            # treat hosts without dots as internal (Render private hostnames are typically without dots)
            if host and ('.' in host):
                qs['sslmode'] = ['require']

        new_query = urlencode(qs, doseq=True)

        rebuilt = urlunparse((scheme, netloc, path, parsed.params, new_query, parsed.fragment))
        SQLALCHEMY_DATABASE_URI = rebuilt
    else:
        # Local development fallback
        SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'
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

