# IT Activity & Security Dashboard

This document describes the IT Activity & Security Dashboard implementation for the Fruit Company system.

## Overview

The IT Activity & Security Dashboard provides IT administrators with comprehensive monitoring of system activities, highlighting suspicious events, and offering AI-assisted diagnostics and remediation suggestions.

## Features

- **Authentication**: Accessible only to users with "IT" or "Admin" roles
- **Real-time Monitoring**: WebSocket-based updates for new events and alerts
- **Activity Timeline**: Paginated table of system events with filtering and search
- **AI Assistant**: Provides analysis of suspicious events with remediation steps
- **Alert Management**: Acknowledge alerts, create incidents, export data
- **Incident Management**: Create and track security incidents

## Architecture

### Backend (Flask + SQLAlchemy)

#### Models
- `ITEvent`: Stores system events (logins, API calls, config changes, etc.)
- `ITAlert`: Stores security alerts and incidents
- `User`: Extended with 'it' and 'admin' roles

#### API Endpoints
- `GET /api/it/events`: Fetch events with filtering and pagination
- `GET /api/it/events/:id`: Get detailed event information
- `POST /api/it/alerts/acknowledge`: Acknowledge selected alerts
- `POST /api/it/incidents`: Create new incidents
- `WS /ws/it/events`: Real-time event streaming

#### WebSocket Integration
Uses Flask-SocketIO for real-time event notifications.

### Frontend (React + Tailwind CSS)

#### Components
- `ITActivityDashboard`: Main dashboard component
- Layout includes:
  - Header with logo, title, and user email
  - Left sidebar: Filters and quick stats
  - Center: Event timeline table with pagination
  - Right sidebar: AI assistant and incident details

#### Features
- Responsive design with Tailwind CSS
- Real-time updates via WebSocket
- CSV export of filtered events
- AI analysis simulation for selected events

## Setup Instructions

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Run database migrations:
   ```bash
   flask db upgrade
   ```

3. Seed sample data:
   ```bash
   python create_sample_it_data.py
   ```

4. Start the backend server:
   ```bash
   flask run
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

### Configuration

#### Alerting Rules
Configure alerting thresholds in `backend/config.py`:

```python
ALERT_RULES = {
    'failed_login_burst': {
        'condition': '>=5 failed_login from same IP within 15m',
        'severity': 'critical',
        'actions': ['block_ip', 'force_password_reset']
    },
    'mass_data_export': {
        'condition': '>1GB data export by non-admin',
        'severity': 'high',
        'actions': ['alert_it_team']
    }
}
```

#### AI Assistant Prompts
Customize AI analysis prompts in the frontend component.

## Usage

1. Log in with an IT or Admin account
2. Access the IT Activity Dashboard
3. Use filters to narrow down events
4. Select events to view details and AI analysis
5. Acknowledge alerts or create incidents as needed
6. Export data for forensic analysis

## Security Considerations

- All user actions are audited
- PII is masked in default views
- Rate limiting on exports
- Role-based access control
- Secure WebSocket connections

## Testing

Run backend tests:
```bash
cd backend
PYTHONPATH=. pytest tests/test_it_events.py
```

Run frontend tests:
```bash
cd frontend
npm test
```

## API Examples

### Fetch Events
```bash
GET /api/it/events?start=2025-09-12T00:00:00Z&end=2025-09-13T00:00:00Z&severity=critical,warning&page=1&per_page=50
```

Response:
```json
{
  "events": [
    {
      "id": "evt_20250912_0001",
      "timestamp": "2025-09-12T08:23:45Z",
      "event_type": "failed_login",
      "severity": "warning",
      "user_email": "jane@fruitco.com",
      "ip": "41.89.23.11",
      "summary": "Failed login — incorrect password"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 50
  }
}
```

### Acknowledge Alerts
```bash
POST /api/it/alerts/acknowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_ids": ["evt_20250912_0001", "evt_20250912_0002"],
  "acknowledged_by": "it@company.com"
}
```

### Create Incident
```bash
POST /api/it/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Brute Force Attack Detected",
  "description": "Multiple failed login attempts from suspicious IP",
  "severity": "high",
  "event_ids": ["evt_20250912_0001"],
  "assigned_to": "security@company.com",
  "suggested_actions": [
    "Block IP 41.89.23.11",
    "Force password reset for affected users"
  ]
}
```

## Development Notes

- The AI assistant currently uses simulated analysis; integrate with actual AI service for production
- WebSocket implementation requires proper scaling for high-volume event streams
- Consider implementing event archiving for long-term storage
- Add more sophisticated alerting rules based on machine learning models
