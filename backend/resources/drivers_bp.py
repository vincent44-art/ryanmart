from flask import Blueprint
from .drivers import drivers_bp

# Re-export the drivers blueprint for __init__.py
drivers_bp_full = Blueprint('drivers', __name__, url_prefix='/api/drivers')
drivers_bp_full.register_blueprint(drivers_bp)

__all__ = ['drivers_bp_full']

