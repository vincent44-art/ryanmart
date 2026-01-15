"""
IT Monitoring utilities for automatic event logging and alerting.
"""

import uuid
from datetime import datetime, timedelta
from flask import request, current_app
from ..models.it_event import ITEvent, EventType, Severity
from ..models.it_alert import ITAlert, AlertSeverity
from ..models.user import User
from extensions import db


def log_event(event_type, severity=Severity.INFO, user_email=None, user_id=None,
              ip=None, device=None, resource=None, summary=None, payload=None,
              server_logs=None, stack_trace=None, related_event_ids=None):
    """
    Log an IT event to the database.
    """
    if not ip:
        ip = request.remote_addr if request else None
    if not device:
        device = request.headers.get('User-Agent') if request else None
    if not resource:
        resource = request.path if request else None

    event_id = f"evt_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"

    event = ITEvent(
        id=event_id,
        user_email=user_email,
        user_id=user_id,
        event_type=event_type,
        severity=severity,
        ip=ip,
        device=device,
        resource=resource,
        summary=summary,
        payload=payload,
        server_logs=server_logs,
        stack_trace=stack_trace,
        related_event_ids=related_event_ids
    )

    db.session.add(event)
    db.session.commit()

    # Check for alerts based on rules
    check_alert_rules(event)

    return event


def check_alert_rules(new_event):
    """
    Check if the new event triggers any alert rules.
    """
    rules = current_app.config.get('ALERT_RULES', {})

    for rule_name, rule_config in rules.items():
        if should_trigger_alert(rule_name, rule_config, new_event):
            create_alert_from_rule(rule_name, rule_config, new_event)


def should_trigger_alert(rule_name, rule_config, event):
    """
    Determine if an alert should be triggered based on the rule.
    """
    condition = rule_config['condition']

    if rule_name == 'failed_login_burst':
        if event.event_type == EventType.FAILED_LOGIN:
            # Check for >=5 failed logins from same IP within 15 minutes
            fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
            count = ITEvent.query.filter(
                ITEvent.event_type == EventType.FAILED_LOGIN,
                ITEvent.ip == event.ip,
                ITEvent.timestamp >= fifteen_min_ago
            ).count()
            return count >= 5

    elif rule_name == 'mass_data_export':
        if event.event_type == EventType.DATA_EXPORT:
            # Check if export size >1GB and user is not admin
            export_size = event.payload.get('export_size_mb', 0) if event.payload else 0
            if export_size > 1024:  # 1GB = 1024MB
                user = User.query.get(event.user_id)
                return user and user.role.value not in ['admin', 'it']

    elif rule_name == 'api_error_burst':
        if event.event_type == EventType.API_ERROR:
            # Check for >=10 API errors within 5 minutes
            five_min_ago = datetime.utcnow() - timedelta(minutes=5)
            count = ITEvent.query.filter(
                ITEvent.event_type == EventType.API_ERROR,
                ITEvent.timestamp >= five_min_ago
            ).count()
            return count >= 10

    elif rule_name == 'permission_change':
        return event.event_type == EventType.PERMISSION_CHANGE

    return False


def create_alert_from_rule(rule_name, rule_config, triggering_event):
    """
    Create an alert based on a triggered rule.
    """
    severity_map = {
        'info': AlertSeverity.LOW,
        'warning': AlertSeverity.MEDIUM,
        'high': AlertSeverity.HIGH,
        'critical': AlertSeverity.CRITICAL
    }

    severity = severity_map.get(rule_config['severity'], AlertSeverity.MEDIUM)

    # Gather related events
    related_events = get_related_events_for_rule(rule_name, triggering_event)

    alert = ITAlert(
        event_ids=[e.id for e in related_events],
        title=get_alert_title(rule_name),
        description=get_alert_description(rule_name, triggering_event),
        severity=severity,
        suggested_actions=rule_config.get('actions', [])
    )

    db.session.add(alert)
    db.session.commit()

    # TODO: Send real-time notification via WebSocket
    # socketio.emit('new_alert', alert.to_dict())


def get_related_events_for_rule(rule_name, triggering_event):
    """
    Get related events for the alert.
    """
    if rule_name == 'failed_login_burst':
        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        return ITEvent.query.filter(
            ITEvent.event_type == EventType.FAILED_LOGIN,
            ITEvent.ip == triggering_event.ip,
            ITEvent.timestamp >= fifteen_min_ago
        ).all()

    elif rule_name == 'api_error_burst':
        five_min_ago = datetime.utcnow() - timedelta(minutes=5)
        return ITEvent.query.filter(
            ITEvent.event_type == EventType.API_ERROR,
            ITEvent.timestamp >= five_min_ago
        ).all()

    else:
        return [triggering_event]


def get_alert_title(rule_name):
    """
    Get alert title for the rule.
    """
    titles = {
        'failed_login_burst': 'Multiple Failed Login Attempts Detected',
        'mass_data_export': 'Large Data Export by Non-Admin User',
        'api_error_burst': 'High Rate of API Errors',
        'permission_change': 'User Permissions Changed'
    }
    return titles.get(rule_name, 'Security Alert')


def get_alert_description(rule_name, event):
    """
    Get alert description for the rule.
    """
    if rule_name == 'failed_login_burst':
        return f"Detected multiple failed login attempts from IP {event.ip}"
    elif rule_name == 'mass_data_export':
        size = event.payload.get('export_size_mb', 0) if event.payload else 0
        return f"Non-admin user exported {size}MB of data"
    elif rule_name == 'api_error_burst':
        return "High number of API errors detected in short time period"
    elif rule_name == 'permission_change':
        return f"Permissions changed for user {event.user_email}"
    return "Anomalous activity detected"


def log_login_success(user):
    """
    Log successful login.
    """
    log_event(
        event_type=EventType.LOGIN,
        severity=Severity.INFO,
        user_email=user.email,
        user_id=user.id,
        summary=f"User {user.email} logged in successfully"
    )


def log_login_failure(email, reason="Invalid credentials"):
    """
    Log failed login attempt.
    """
    log_event(
        event_type=EventType.FAILED_LOGIN,
        severity=Severity.WARNING,
        user_email=email,
        summary=f"Failed login attempt: {reason}"
    )


def log_api_error(resource, error_message, status_code=None):
    """
    Log API error.
    """
    from flask_jwt_extended import get_jwt_identity
    user_id = None
    user = None
    # Avoid JWT lookup for static files or images
    if not (str(resource).startswith('/static') or str(resource).endswith('.png') or str(resource).endswith('.jpg') or str(resource).endswith('.jpeg') or str(resource).endswith('.ico')):
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id) if user_id else None
        except Exception:
            user_id = None
            user = None
    log_event(
        event_type=EventType.API_ERROR,
        severity=Severity.WARNING,
        user_email=user.email if user else None,
        user_id=user_id,
        summary=f"API Error: {error_message}",
        payload={'status_code': status_code, 'error_message': error_message}
    )


def log_permission_change(changed_user_email, changed_by_email, old_perms, new_perms):
    """
    Log permission change.
    """
    changed_by = User.query.filter_by(email=changed_by_email).first()
    changed_user = User.query.filter_by(email=changed_user_email).first()

    log_event(
        event_type=EventType.PERMISSION_CHANGE,
        severity=Severity.INFO,
        user_email=changed_user_email,
        user_id=changed_user.id if changed_user else None,
        summary=f"Permissions changed for {changed_user_email}",
        payload={
            'changed_by': changed_by_email,
            'old_permissions': old_perms,
            'new_permissions': new_perms
        }
    )


def log_data_export(user_email, export_size_mb, record_count, export_format):
    """
    Log data export.
    """
    user = User.query.filter_by(email=user_email).first()

    log_event(
        event_type=EventType.DATA_EXPORT,
        severity=Severity.WARNING if export_size_mb > 100 else Severity.INFO,
        user_email=user_email,
        user_id=user.id if user else None,
        summary=f"Data export: {export_size_mb}MB, {record_count} records",
        payload={
            'export_size_mb': export_size_mb,
            'record_count': record_count,
            'export_format': export_format
        }
    )
