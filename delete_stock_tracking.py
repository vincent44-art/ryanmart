from backend.app import create_app
from backend.extensions import db
from backend.models.stock_tracking import StockTracking

app = create_app()

with app.app_context():
    num_deleted = StockTracking.query.delete()
    db.session.commit()
    print(f"Successfully deleted {num_deleted} records from the stock_tracking table.")
