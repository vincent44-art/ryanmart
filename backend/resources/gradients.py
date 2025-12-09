from flask_restful import Resource, reqparse
from datetime import datetime
from backend.extensions import db
from backend.models.gradient import Gradient
from ..utils.helpers import make_response_data, get_current_user
from ..utils.decorators import role_required

gradient_parser = reqparse.RequestParser()
gradient_parser.add_argument('application_date', type=str, required=True)
gradient_parser.add_argument('name', type=str, required=True)
gradient_parser.add_argument('description', type=str)
gradient_parser.add_argument('fruit_type', type=str, required=True)
gradient_parser.add_argument('gradient_type', type=str, required=True)
gradient_parser.add_argument('notes', type=str)
gradient_parser.add_argument('quantity', type=str)
gradient_parser.add_argument('unit', type=str)
gradient_parser.add_argument('purpose', type=str)

class GradientListResource(Resource):
    @role_required('ceo', 'storekeeper')
    def get(self):
        gradients = Gradient.query.order_by(Gradient.application_date.desc()).all()
        return make_response_data(data=[g.to_dict() for g in gradients], message="Gradients fetched.")

    @role_required('storekeeper')
    def post(self):
        data = gradient_parser.parse_args()
        current_user = get_current_user()

        try:
            app_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response_data(success=False, message="Invalid date format. Use YYYY-MM-DD.", status_code=400)
            
        new_gradient = Gradient(
            application_date=app_date,
            name=data['name'],
            description=data.get('description'),
            fruit_type=data['fruit_type'],
            gradient_type=data['gradient_type'],
            notes=data.get('notes'),
            quantity=data.get('quantity'),
            unit=data.get('unit'),
            purpose=data.get('purpose')
        )
        db.session.add(new_gradient)
        db.session.commit()
        return make_response_data(data=new_gradient.to_dict(), message="Gradient application recorded.", status_code=201)

class ClearGradientsResource(Resource):
    @role_required('ceo')
    def delete(self):
        num_deleted = Gradient.query.delete()
        db.session.commit()
        return make_response_data(message=f"Successfully cleared {num_deleted} gradient records.")