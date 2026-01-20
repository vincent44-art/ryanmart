import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import quote_plus, urlparse, urlunparse, parse_qs, urlencode
import sqlalchemy as _sa

load_dotenv()


def sanitize_url(dsn: str) -> str:
    """Return a redacted DB URL safe for logs (password replaced)."""
    if not dsn:
        return dsn
    parsed = urlparse(dsn)
    netloc = parsed.netloc
    if "@" in netloc:
        userinfo, hostpart = netloc.split("@", 1)
        if ":" in userinfo:
            user, _ = userinfo.split(":", 1)
            netloc = f"{user}:<redacted>@{hostpart}"
        else:
            netloc = f"{userinfo}@{hostpart}"
    safe = parsed._replace(netloc=netloc)
    return urlunparse(safe)


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Get database URL and strip "DATABASE_URL=" prefix if present (some platforms add this)
    _db_url = os.environ.get("DATABASE_URL", "")
    if _db_url.startswith("DATABASE_URL="):
        _db_url = _db_url[len("DATABASE_URL="):]
    SQLALCHEMY_DATABASE_URI = _db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {
            "connect_timeout": 10
        }
    }
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Configure CORS origins. In production set CORS_ORIGINS as a comma-separated
    # environment variable, e.g. CORS_ORIGINS=https://app.example.com,https://admin.example.com
    #
    # IMPORTANT: The frontend is deployed at https://ryanmart-frontend.onrender.com
    # The backend is deployed at https://ryanmart-backend.onrender.com
    # These URLs must match EXACTLY for CORS to work.
    _cors_env = os.environ.get('CORS_ORIGINS')
    if _cors_env:
        CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
    else:
        # Production and development fallback URLs
        # These MUST match the exact deployed URLs for CORS to work
        CORS_ORIGINS = [
            "https://ryanmart-frontend.onrender.com",  # Production frontend
            "http://localhost:3000",  # React Create App default
            "http://localhost:5173",  # Vite default
        ]

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


# Print a sanitized database URI and SQLAlchemy/psycopg info at import time
try:
    _safe = sanitize_url(Config.SQLALCHEMY_DATABASE_URI)
except Exception:
    _safe = None
print("[startup] SQLALCHEMY_DATABASE_URI:", _safe)
try:
    print("[startup] SQLAlchemy:", _sa.__version__)
except Exception:
    pass
 
