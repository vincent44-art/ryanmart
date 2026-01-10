import pytest
from models.it_event import ITEvent, EventType, Severity
from models.it_alert import ITAlert, AlertSeverity
from models.user import User, UserRole
from extensions import db
from datetime import datetime


def test_create_it_event(app):
    with app.app_context():
        # Create a test user
        user = User(
            email='test@example.com',
            password='hashed_password',
            role=UserRole.IT
        )
        db.session.add(user)
        db.session.commit()

        # Create an IT event
        event = ITEvent(
            id='test-event-123',
            user_email='test@example.com',
            user_id=user.id,
            event_type=EventType.LOGIN,
            severity=Severity.INFO,
            ip='192.168.1.1',
            device='Chrome/91.0',
            resource='/api/auth/login',
            summary='User logged in successfully'
        )
        db.session.add(event)
        db.session.commit()

        # Verify the event was created
        assert event.id == 'test-event-123'
        assert event.event_type == EventType.LOGIN
        assert event.severity == Severity.INFO


def test_create_it_alert(app):
    with app.app_context():
        # Create an IT alert
        alert = ITAlert(
            event_ids=['event-1', 'event-2'],
            title='Multiple failed login attempts',
            description='Detected multiple failed login attempts from IP 192.168.1.1',
            severity=AlertSeverity.HIGH,
            assigned_to='admin@example.com'
        )
        db.session.add(alert)
        db.session.commit()

        # Verify the alert was created
        assert alert.title == 'Multiple failed login attempts'
        assert alert.severity == AlertSeverity.HIGH
        assert len(alert.event_ids) == 2


def test_it_event_to_dict():
    event = ITEvent(
        id='test-event-123',
        timestamp=datetime.utcnow(),
        user_email='test@example.com',
        event_type=EventType.LOGIN,
        severity=Severity.INFO,
        summary='Test event'
    )

    event_dict = event.to_dict()
    assert event_dict['id'] == 'test-event-123'
    assert event_dict['event_type'] == 'login'
    assert event_dict['severity'] == 'info'


def test_it_alert_to_dict():
    alert = ITAlert(
        id=1,
        event_ids=['event-1'],
        title='Test alert',
        severity=AlertSeverity.MEDIUM,
        acknowledged=False
    )

    alert_dict = alert.to_dict()
    assert alert_dict['id'] == 1
    assert alert_dict['title'] == 'Test alert'
    assert alert_dict['severity'] == 'medium'
    assert alert_dict['acknowledged'] == False
