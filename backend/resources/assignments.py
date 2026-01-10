from flask import Blueprint, request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from models.assignment import Assignment
from models.sales import Sale
from models.user import db
from utils.helpers import make_response_data

assignments_bp = Blueprint('assignments_bp', __name__, url_prefix='/api/assignments')

@assignments_bp.route('', methods=['GET'])
def get_assignments():
    seller = request.args.get('seller')
    assignments = Assignment.query.filter_by(seller_email=seller).all()
    return jsonify([a.to_dict() for a in assignments]), 200

@assignments_bp.route('/<assignment_id>/sales', methods=['POST'])
def add_sale(assignment_id):
    data = request.get_json()
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    from datetime import datetime
    date_str = data.get('date', None)
    sale_date = None
    if date_str:
        try:
            sale_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            sale_date = None
    sale = Sale(
        assignment=assignment_id,
        seller_id=assignment.seller_id,
        fruit_type=data.get('fruitType'),
        quantity=data.get('quantity'),
        revenue=data.get('revenue'),
        sale_date=sale_date
    )
    db.session.add(sale)
    db.session.commit()
    return jsonify(sale.to_dict()), 201

@assignments_bp.route('/create', methods=['POST'])
def create_assignment():
    data = request.get_json()
    seller_id = data.get('seller_id')
    seller_email = data.get('seller_email')
    fruit_type = data.get('fruit_type', 'mango')
    # assignment_id is not used as primary key, let DB autoincrement id
    # Only check for duplicate by seller_id, seller_email, fruit_type
    assignment = Assignment.query.filter_by(seller_id=seller_id, seller_email=seller_email, fruit_type=fruit_type).first()
    if assignment:
        return jsonify(assignment.to_dict()), 200
    assignment = Assignment(
        seller_id=seller_id,
        seller_email=seller_email,
        fruit_type=fruit_type
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify(assignment.to_dict()), 201

class AssignmentResource(Resource):
    @jwt_required()
    def delete(self, assignment_id):
        assignment = Assignment.query.get(assignment_id)
        if not assignment:
            return make_response_data(success=False, message="Assignment not found.", status_code=404)
        db.session.delete(assignment)
        db.session.commit()
        return make_response_data(message="Assignment deleted.", status_code=200)