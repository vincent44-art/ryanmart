from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.it_alert import ITAlert, AlertSeverity
from ..models.user import User
from ..utils.helpers import make_response_data
from datetime import datetime
import logging


class ITAlertsResource(Resource):
    @jwt_required()
    def get(self):
        # Check role
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        logging.info(f"User: {user.email if user else 'None'}, Role: {user.role.value if user else 'None'}")
        if not user or user.role.value not in ['it', 'admin']:
            return make_response_data(success=False, message="Access denied", status_code=403)

        parser = reqparse.RequestParser()
        parser.add_argument('start', type=str, help='Start date ISO string')
        parser.add_argument('end', type=str, help='End date ISO string')
        parser.add_argument('severity', type=str, action='append', help='Severity filter')
        parser.add_argument('acknowledged', type=str, help='Acknowledged filter')
        parser.add_argument('page', type=int, default=1, help='Page number')
        parser.add_argument('per_page', type=int, default=50, help='Items per page')

        args = parser.parse_args()

        # Convert acknowledged string to boolean
        if args['acknowledged'] is not None:
            args['acknowledged'] = args['acknowledged'].lower() == 'true'

        # Fix for single value query params passed as string instead of list
        if args['severity'] and isinstance(args['severity'], str):
            args['severity'] = [args['severity']]

        query = ITAlert.query

        if args['start']:
            start_date = datetime.fromisoformat(args['start'].replace('Z', '+00:00'))
            query = query.filter(ITAlert.created_at >= start_date)

        if args['end']:
            end_date = datetime.fromisoformat(args['end'].replace('Z', '+00:00'))
            query = query.filter(ITAlert.created_at <= end_date)

        if args['severity']:
            severities = [AlertSeverity(s) for s in args['severity'] if s in [e.value for e in AlertSeverity]]
            query = query.filter(ITAlert.severity.in_(severities))

        if args['acknowledged'] is not None:
            query = query.filter(ITAlert.acknowledged == args['acknowledged'])

        # Pagination
        total = query.count()
        alerts = query.order_by(ITAlert.created_at.desc()).paginate(
            page=args['page'], per_page=args['per_page'], error_out=False
        )

        return make_response_data(data={
            'alerts': [alert.to_dict() for alert in alerts.items],
            'meta': {
                'total': total,
                'page': alerts.page,
                'per_page': alerts.per_page,
                'pages': alerts.pages
            }
        })


class ITIncidentsResource(Resource):
    @jwt_required()
    def post(self):
        # Check role
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value not in ['it', 'admin']:
            return make_response_data(success=False, message="Access denied", status_code=403)

        parser = reqparse.RequestParser()
        parser.add_argument('title', type=str, required=True, help='Incident title')
        parser.add_argument('description', type=str, help='Incident description')
        parser.add_argument('severity', type=str, required=True, choices=[e.value for e in AlertSeverity], help='Incident severity')
        parser.add_argument('event_ids', type=list, location='json', required=True, help='Related event IDs')
        parser.add_argument('assigned_to', type=str, help='Assigned to email')
        parser.add_argument('suggested_actions', type=list, location='json', help='Suggested remediation actions')

        args = parser.parse_args()

        alert = ITAlert(
            event_ids=args['event_ids'],
            title=args['title'],
            description=args['description'],
            severity=AlertSeverity(args['severity']),
            assigned_to=args['assigned_to'],
            suggested_actions=args['suggested_actions']
        )

        from ..extensions import db
        db.session.add(alert)
        db.session.commit()

        return make_response_data(data=alert.to_dict(), message="Incident created successfully", status_code=201)
