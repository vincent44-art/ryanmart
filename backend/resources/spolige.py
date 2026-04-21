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
        
        import logging
        logger = logging.getLogger(__name__)
        
        try:

            if getattr(user, 'role', None) == 'ceo':
                spolige_records = Spolige.query.all()
            else:
                # Others see only their own records
                spolige_records = Spolige.query.filter_by(created_by=current_user_id).all()
        except Exception as e:
            logger.error(f"Database query failed: {str(e)}")
            # Fallback to raw SQL
            try:
                query = text("""
                    SELECT id, fruit_name, quantity, stage, amount_per_kg, total_amount, 
                           description, date, created_by, created_at, updated_at
                    FROM spolige 
                    ORDER BY created_at DESC
                """)
                result = db.session.execute(query).fetchall()
                spolige_records = []
                for row in result:
                    spolige_records.append({
                        'id': row[0], 'fruit_name': row[1], 'quantity': float(row[2]) if row[2] else 0,
                        'stage': row[3], 'amount_per_kg': float(row[4]) if row[4] else 0, 
                        'total_amount': float(row[5]) if row[5] else 0,
                        'description': row[6], 'date': row[7].isoformat() if row[7] else None,
                        'created_by': row[8], 'created_at': row[9].isoformat() if row[9] else None,
                        'updated_at': row[10].isoformat() if row[10] else None
                    })
            except Exception as fallback_e:
                logger.error(f"Raw SQL fallback failed: {str(fallback_e)}")
                spolige_records = []
        
        return [record.to_dict() for record in spolige_records] if spolige_records else [], 200
    
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

