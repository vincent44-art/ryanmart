import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ITActivityDashboard from '../../pages/ITActivityDashboard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API functions
jest.mock('../../api/it', () => ({
  fetchEvents: jest.fn(),
  acknowledgeAlerts: jest.fn(),
  createIncident: jest.fn(),
}));

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    user: { email: 'it@fruitco.com', role: 'it' },
  }),
}));

// Mock date-fns formatISO
jest.mock('date-fns', () => ({
  formatISO: jest.fn(() => '2025-09-12T08:23:45Z'),
}));

const mockFetchEvents = require('../../api/it').fetchEvents;

describe('ITActivityDashboard', () => {
  beforeEach(() => {
    mockFetchEvents.mockResolvedValue({
      data: {
        events: [
          {
            id: 'evt_001',
            timestamp: '2025-09-12T08:23:45Z',
            event_type: 'failed_login',
            severity: 'warning',
            user_email: 'jane@fruitco.com',
            ip: '41.89.23.11',
            device: 'Chrome/114.0',
            resource: '/api/auth/login',
            summary: 'Failed login attempt',
            payload: { attempts: 5 },
          },
        ],
        meta: { total: 1, page: 1, per_page: 50 },
      },
    });
  });

  test('renders dashboard header with user email', async () => {
    render(
      <AuthProvider>
        <ITActivityDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('IT Activity Dashboard')).toBeInTheDocument();
      expect(screen.getByText('IT: it@fruitco.com')).toBeInTheDocument();
    });
  });

  test('displays events in table', async () => {
    render(
      <AuthProvider>
        <ITActivityDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed login attempt')).toBeInTheDocument();
      expect(screen.getByText('jane@fruitco.com')).toBeInTheDocument();
      expect(screen.getByText('41.89.23.11')).toBeInTheDocument();
    });
  });

  test('filters work correctly', async () => {
    render(
      <AuthProvider>
        <ITActivityDashboard />
      </AuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Failed login attempt')).toBeInTheDocument();
    });

    // Change severity filter - use getAllByDisplayValue and pick the first one
    const severitySelects = screen.getAllByDisplayValue('');
    const severitySelect = severitySelects.find(select =>
      select.previousElementSibling && select.previousElementSibling.textContent === 'Severity'
    );
    if (severitySelect) {
      fireEvent.change(severitySelect, { target: { value: 'warning' } });
    }

    // Verify fetchEvents was called with correct params
    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({ severity: ['warning'] }),
        expect.any(String)
      );
    });
  });

  test('export CSV functionality', async () => {
    // Mock URL.createObjectURL and document methods
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    document.createElement = jest.fn(() => ({
      click: jest.fn(),
      setAttribute: jest.fn(),
    }));

    render(
      <AuthProvider>
        <ITActivityDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed login attempt')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    // Verify blob creation (this is a basic check)
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  test('acknowledges selected alerts', async () => {
    const mockAcknowledge = require('../../api/it').acknowledgeAlerts;
    mockAcknowledge.mockResolvedValue({});

    render(
      <AuthProvider>
        <ITActivityDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed login attempt')).toBeInTheDocument();
    });

    // Select the event
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Click acknowledge button
    const acknowledgeButton = screen.getByText('Acknowledge selected alerts');
    fireEvent.click(acknowledgeButton);

    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledWith(['evt_001'], expect.any(String));
    });
  });
});
