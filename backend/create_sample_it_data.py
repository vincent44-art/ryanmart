#!/usr/bin/env python3
"""
Script to seed sample IT events and alerts for testing the IT Activity Dashboard.
"""

from app import create_app
from models.it_event import ITEvent, EventType, Severity
from models.it_alert import ITAlert, AlertSeverity
from models.user import User, UserRole
from extensions import db
from datetime import datetime, timedelta
import random

def create_sample_users():
    """Create sample IT and admin users."""
    users = [
        User(
            email='it@fruitco.com',
            role=UserRole.IT,
            name='IT Administrator',
            salary=75000.0
        ),
        User(
            email='admin@fruitco.com',
            role=UserRole.ADMIN,
            name='System Admin',
            salary=80000.0
        ),
        User(
            email='jane@fruitco.com',
            role=UserRole.SELLER,
            name='Jane Smith',
            salary=45000.0
        ),
        User(
            email='john@fruitco.com',
            role=UserRole.PURCHASER,
            name='John Doe',
            salary=50000.0
        )
    ]

    for user in users:
        user.set_password('password123')
        db.session.add(user)

    db.session.commit()
    return users

def create_sample_events(users):
    """Create sample IT events."""
    events = []
    base_time = datetime.utcnow() - timedelta(days=7)

    # Normal login events
    for i in range(50):
        event = ITEvent(
            id=f'evt_{base_time.strftime("%Y%m%d")}_{i:04d}',
            timestamp=base_time + timedelta(hours=i*2),
            user_email=random.choice([u.email for u in users]),
            user_id=random.choice(users).id,
            event_type=EventType.LOGIN,
            severity=Severity.INFO,
            ip=f'192.168.1.{random.randint(10, 250)}',
            device='Chrome/114.0 on Windows 10',
            resource='/api/auth/login',
            summary='User logged in successfully',
            payload={
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'geolocation': 'Nairobi, KE',
                'session_id': f'sess_{random.randint(1000, 9999)}'
            }
        )
        events.append(event)

    # Failed login events (suspicious)
    for i in range(10):
        event = ITEvent(
            id=f'evt_failed_{base_time.strftime("%Y%m%d")}_{i:04d}',
            timestamp=base_time + timedelta(hours=i*3),
            user_email='jane@fruitco.com',
            user_id=next(u.id for u in users if u.email == 'jane@fruitco.com'),
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.WARNING,
            ip='41.89.23.11',
            device='Chrome/114.0 on Windows 10',
            resource='/api/auth/login',
            summary='Failed login — incorrect password',
            payload={
                'attempts_from_ip_last_hour': random.randint(3, 15),
                'geolocation': 'Unknown',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'raw_request_id': f'req_{random.randint(100000, 999999)}'
            }
        )
        events.append(event)

    # API errors
    for i in range(5):
        event = ITEvent(
            id=f'evt_api_{base_time.strftime("%Y%m%d")}_{i:04d}',
            timestamp=base_time + timedelta(hours=i*4),
            user_email=random.choice([u.email for u in users]),
            user_id=random.choice(users).id,
            event_type=EventType.API_ERROR,
            severity=Severity.WARNING,
            ip=f'192.168.1.{random.randint(10, 250)}',
            device='Postman/10.12.0',
            resource='/api/sales',
            summary='API rate limit exceeded',
            payload={
                'error_code': 429,
                'error_message': 'Too many requests',
                'request_count_last_minute': random.randint(50, 200)
            }
        )
        events.append(event)

    # Permission changes
    for i in range(3):
        event = ITEvent(
            id=f'evt_perm_{base_time.strftime("%Y%m%d")}_{i:04d}',
            timestamp=base_time + timedelta(hours=i*6),
            user_email='admin@fruitco.com',
            user_id=next(u.id for u in users if u.email == 'admin@fruitco.com'),
            event_type=EventType.PERMISSION_CHANGE,
            severity=Severity.INFO,
            ip='192.168.1.100',
            device='Chrome/114.0 on macOS',
            resource='/api/admin/users/jane@fruitco.com',
            summary='User permissions updated',
            payload={
                'changed_by': 'admin@fruitco.com',
                'old_permissions': ['read', 'write'],
                'new_permissions': ['read', 'write', 'admin'],
                'reason': 'Promoted to admin role'
            }
        )
        events.append(event)

    # Data exports
    for i in range(2):
        event = ITEvent(
            id=f'evt_export_{base_time.strftime("%Y%m%d")}_{i:04d}',
            timestamp=base_time + timedelta(hours=i*8),
            user_email='jane@fruitco.com',
            user_id=next(u.id for u in users if u.email == 'jane@fruitco.com'),
            event_type=EventType.DATA_EXPORT,
            severity=Severity.WARNING,
            ip='192.168.1.150',
            device='Chrome/114.0 on Windows 10',
            resource='/api/reports/sales',
            summary='Large data export initiated',
            payload={
                'export_size_mb': random.randint(500, 2000),
                'record_count': random.randint(10000, 50000),
                'export_format': 'CSV',
                'filters_applied': {'date_range': 'last_30_days'}
            }
        )
        events.append(event)

    for event in events:
        db.session.add(event)

    db.session.commit()
    return events

def create_sample_alerts(events):
    """Create sample alerts based on events."""
    alerts = []

    # Failed login burst alert
    failed_events = [e for e in events if e.event_type == EventType.FAILED_LOGIN]
    if failed_events:
        alert = ITAlert(
            event_ids=[e.id for e in failed_events[:5]],
            title='Multiple Failed Login Attempts',
            description='Detected 5+ failed login attempts from IP 41.89.23.11 within 2 hours',
            severity=AlertSeverity.HIGH,
            assigned_to='it@fruitco.com',
            suggested_actions=[
                'Block IP 41.89.23.11 at firewall',
                'Force password reset for jane@fruitco.com',
                'Enable 2FA for affected account',
                'Review login logs for additional suspicious activity'
            ]
        )
        alerts.append(alert)

    # Large data export alert
    export_events = [e for e in events if e.event_type == EventType.DATA_EXPORT]
    if export_events:
        alert = ITAlert(
            event_ids=[e.id for e in export_events],
            title='Large Data Export by Non-Admin User',
            description='Non-admin user initiated large data export (>500MB)',
            severity=AlertSeverity.MEDIUM,
            assigned_to='it@fruitco.com',
            suggested_actions=[
                'Review export contents for sensitive data',
                'Verify user authorization for this export',
                'Implement additional approval workflow for large exports'
            ]
        )
        alerts.append(alert)

    # API rate limit alert
    api_events = [e for e in events if e.event_type == EventType.API_ERROR]
    if api_events:
        alert = ITAlert(
            event_ids=[e.id for e in api_events],
            title='API Rate Limiting Triggered',
            description='Multiple API rate limit violations detected',
            severity=AlertSeverity.LOW,
            assigned_to='devops@fruitco.com',
            suggested_actions=[
                'Review API usage patterns',
                'Consider increasing rate limits if legitimate',
                'Implement progressive backoff in client applications'
            ]
        )
        alerts.append(alert)

    for alert in alerts:
        db.session.add(alert)

    db.session.commit()
    return alerts

def main():
    app = create_app()
    with app.app_context():
        print("Creating sample users...")
        users = create_sample_users()

        print("Creating sample events...")
        events = create_sample_events(users)

        print("Creating sample alerts...")
        alerts = create_sample_alerts(events)

        print(f"Created {len(users)} users, {len(events)} events, and {len(alerts)} alerts.")

if __name__ == '__main__':
    main()
