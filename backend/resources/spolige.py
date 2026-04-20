from flask_restful import Resource
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.spolige import Spolige
from extensions import db


class SpoligeListResource(Resource):
    @jwt_required()
    def get(self):
        """Get all spolige records (CEO sees all, others see own)"""
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return {"message": "Authentication required"}, 401
        
        try:
            current_user_id = int(current_user_id)
        except (TypeError, ValueError):
            pass
        
        from models.user import User
        user = User.query.get(current_user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        # CEO sees all records
        if getattr(user, 'role', None) == 'ceo':
            spolige_records = Spolige.query.all()
        else:
            # Others see only their own records
            spolige_records = Spolige.query.filter_by(created_by=current_user_id).all()
        
        return [record.to_dict() for record in spolige_records], 200
    
    @jwt_required()
    def post(self):
        """Create new spolige record"""
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return {"message": "Authentication required"}, 401
        
        try:
            current_user_id = int(current_user_id)
        except (TypeError, ValueError):
            pass
        
        # Basic validation
        required_fields = ['fruit_name', 'quantity', 'total_amount', 'date']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return {"message": f"Missing fields: {', '.join(missing)}"}, 400
        
        new_spolige = Spolige(
            fruit_name=data['fruit_name'],
            quantity=float(data['quantity']),
            total_amount=float(data['total_amount']),
            date=data['date'],
            created_by=current_user_id
        )
        
        db.session.add(new_spolige)
        db.session.commit()
        return new_spolige.to_dict(), 201

class SpoligeResource(Resource):
    @jwt_required()
    def get(self, spolige_id):
        spolige = Spolige.query.get_or_404(spolige_id)
        return spolige.to_dict(), 200
    
    @jwt_required()
    def put(self, spolige_id):
        spolige = Spolige.query.get_or_404(spolige_id)
        data = request.get_json()
        
        spolige.fruit_name = data.get('fruit_name', spolige.fruit_name)
        spolige.quantity = float(data.get('quantity', spolige.quantity))
        spolige.total_amount = float(data.get('total_amount', spolige.total_amount))
        
        db.session.commit()
        return spolige.to_dict(), 200
    
    @jwt_required()
    def delete(self, spolige_id):
        spolige = Spolige.query.get_or_404(spolige_id)
        db.session.delete(spolige)
        db.session.commit()
        return {"message": "Spolige record deleted"}, 200

