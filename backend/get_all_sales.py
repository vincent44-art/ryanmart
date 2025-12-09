from backend.app import app
from backend.models.sales import Sale

with app.app_context():
    data = [s.id for s in Sale.query.all()]
    print(data)
