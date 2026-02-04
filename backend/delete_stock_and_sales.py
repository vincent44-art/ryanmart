from extensions import db
from models.stock_tracking import StockTracking
from models.stock_movement import StockMovement
from models.inventory import Inventory
from models.sales import Sale

def delete_stock_and_sales_data():
    try:
        # Delete in order to handle foreign key constraints
        # First delete StockMovement (depends on Inventory)
        StockMovement.query.delete()
        # Then delete Inventory
        Inventory.query.delete()
        # Then delete StockTracking (no dependencies)
        StockTracking.query.delete()
        # Then delete Sale (depends on user and seller_fruits, but seller_fruits remains)
        Sale.query.delete()

        db.session.commit()
        print("Data deleted from stock tables (stock_tracking, stock_movement, inventory) and sales table successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"Failed to delete data: {str(e)}")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        delete_stock_and_sales_data()
