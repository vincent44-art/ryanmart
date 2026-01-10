from flask_restful import Resource
from flask import request
from flask_jwt_extended import jwt_required
from extensions import db
from models.receipt import Receipt
from utils.helpers import make_response_data
import json
from datetime import datetime

class ReceiptResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        receipt = Receipt(
            receipt_num=data['invoiceNum'],
            seller_name=data['seller']['name'],
            seller_address=data['seller']['address'],
            seller_phone=data['seller']['phone'],
            buyer_name=data['buyer']['name'],
            buyer_contact=data['buyer']['contact'],
            date=datetime.fromisoformat(data['date']),
            payment=data['payment'],
            items=json.dumps(data['items']),
            subtotal=float(data['subtotal']) if data['subtotal'] else 0.0,
            discount=float(data['discount']) if data['discount'] else 0.0,
            final_total=float(data['finalTotal']) if data['finalTotal'] else 0.0
        )
        db.session.add(receipt)
        db.session.commit()
        return make_response_data(data={'id': receipt.id}, message='Receipt saved.')

    def get(self, receipt_num):
        receipt = Receipt.query.filter_by(receipt_num=receipt_num).first()
        if not receipt:
            return make_response_data(False, 404, 'Receipt not found.')
        return make_response_data(data=receipt.to_dict())
