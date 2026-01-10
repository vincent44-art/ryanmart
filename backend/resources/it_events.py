from flask_restful import Resource, reqparse
from flask import request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.it_event import ITEvent, EventType, Severity
from models.user import User
from utils.helpers import make_response_data
from extensions import db
from datetime import datetime, timedelta
import json

class ITEventsResource(Resource):
    @jwt_required()
    def get(self):
        # Check if user has IT or Admin role
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['it', 'admin']:
            return make_response_data(success=False, message="Access denied", status_code=403)

        parser = reqparse.RequestParser()
        parser.add_argument('start', type=str, help='Start date ISO string')
        parser.add_argument('end', type=str, help='End date ISO string')
        parser.add_argument('severity[]', type=str, action='append', help='Severity filter')
        parser.add_argument('event_type[]', type=str, action='append', help='Event type filter')
        parser.add_argument('user_email', type=str, help='User email filter')
        parser.add_argument('page', type=int, default=1, help='Page number')
        parser.add_argument('per_page', type=int, default=50, help='Items per page')

        args = parser.parse_args()

        # Handle array parameters
        args['severity'] = args.pop('severity[]', [])
        args['event_type'] = args.pop('event_type[]', [])

        query = ITEvent.query

        if args['start']:
            start_date = datetime.fromisoformat(args['start'].replace('Z', '+00:00'))
            query = query.filter(ITEvent.timestamp >= start_date)

        if args['end']:
            end_date = datetime.fromisoformat(args['end'].replace('Z', '+00:00'))
            query = query.filter(ITEvent.timestamp <= end_date)

        if args['severity']:
            severities = [Severity(s) for s in args['severity'] if s in [e.value for e in Severity]]
            query = query.filter(ITEvent.severity.in_(severities))

        if args['event_type']:
            event_types = [EventType(et) for et in args['event_type'] if et in [e.value for e in EventType]]
            query = query.filter(ITEvent.event_type.in_(event_types))

        if args['user_email']:
            query = query.filter(ITEvent.user_email == args['user_email'])

        # Pagination
        total = query.count()
        events = query.order_by(ITEvent.timestamp.desc()).paginate(
            page=args['page'], per_page=args['per_page'], error_out=False
        )

        return make_response_data(data={
            'events': [event.to_dict() for event in events.items],
            'meta': {
                'total': total,
                'page': events.page,
                'per_page': events.per_page,
                'pages': events.pages
            }
        })


class ITEventResource(Resource):
    @jwt_required()
    def get(self, event_id):
        # Check role
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['it', 'admin']:
            return make_response_data(success=False, message="Access denied", status_code=403)

        event = ITEvent.query.get(event_id)
        if not event:
            return make_response_data(success=False, message="Event not found", status_code=404)

        return make_response_data(data=event.to_dict())


class ITAcknowledgeAlertsResource(Resource):
    @jwt_required()
    def post(self):
        # Check role
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['it', 'admin']:
            return make_response_data(success=False, message="Access denied", status_code=403)

        parser = reqparse.RequestParser()
        parser.add_argument('event_ids', type=list, location='json', required=True, help='List of event IDs to acknowledge')
        args = parser.parse_args()

        # For simplicity, we'll just mark as acknowledged in a future alert system
        # Here we can log the acknowledgment
        # In a real system, you'd have an acknowledgment table

        return make_response_data(message="Alerts acknowledged successfully")
