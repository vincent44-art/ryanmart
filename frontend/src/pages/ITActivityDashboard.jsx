import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchEvents, acknowledgeAlerts } from '../api/it';
import { formatISO } from 'date-fns';
import { Moon, Sun, LogOut } from 'lucide-react';

const EVENT_TYPES = [
  'login', 'logout', 'failed_login', 'permission_change', 'data_export',
  'file_upload', 'config_change', 'api_error'
];

const SEVERITIES = ['info', 'warning', 'critical'];

function ITActivityDashboard() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    severity: [],
    event_type: [],
    user_email: '',
    ip: '',
    resource: '',
  });
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [selectedEventIds, setSelectedEventIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  // Fetch events with filters and pagination
  const loadEvents = useCallback(async () => {
    const params = {
      start: filters.start ? formatISO(new Date(filters.start)) : undefined,
      end: filters.end ? formatISO(new Date(filters.end)) : undefined,
      severity: filters.severity.length ? filters.severity : undefined,
      event_type: filters.event_type.length ? filters.event_type : undefined,
      user_email: filters.user_email || undefined,
      page,
      per_page: perPage,
    };
    try {
      const token = localStorage.getItem('access_token');
      const data = await fetchEvents(params, token);
      setEvents(data.data.events);
      setTotal(data.data.meta.total);
    } catch (error) {
      console.error('Failed to load events', error);
    }
  }, [filters, page, perPage]);



  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // Toggle event selection
  const toggleSelectEvent = (eventId) => {
    setSelectedEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Acknowledge selected alerts
  const handleAcknowledge = async () => {
    if (selectedEventIds.size === 0) return;
    setAcknowledging(true);
    try {
      const token = localStorage.getItem('access_token');
      await acknowledgeAlerts(Array.from(selectedEventIds), token);
      setSelectedEventIds(new Set());
      loadEvents();
    } catch (error) {
      console.error('Failed to acknowledge alerts', error);
    } finally {
      setAcknowledging(false);
    }
  };

  // Export CSV of current filtered events
  const handleExportCSV = () => {
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'User Email', 'IP', 'Device', 'Resource', 'Summary', 'Severity'
    ];
    const rows = events.map(e => [
      e.id,
      e.timestamp,
      e.event_type,
      e.user_email,
      e.ip,
      e.device,
      e.resource,
      e.summary,
      e.severity
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'it_activity_events.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Assistant: simulate analysis for selected event
  useEffect(() => {
    if (!selectedEvent) {
      setAiAnalysis('');
      return;
    }
    // Simulate AI analysis with a timeout
    const timer = setTimeout(() => {
      setAiAnalysis(`Analysis for event ${selectedEvent.id}:
- Suspicious because: ${selectedEvent.summary}
- Probability of compromise: 75%
- Immediate remediation: Block IP ${selectedEvent.ip}, Force password reset for ${selectedEvent.user_email}
- Medium-term: Enable 2FA for user
- Long-term: Review logs and audit permissions
`);
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedEvent]);

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 shadow mb-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center space-x-4">
          <img src="/logo.jpeg" alt="Company Logo" className="h-10 w-10 rounded-full" />
          <h1 className="text-xl font-bold">IT Activity Dashboard</h1>
        </div>
          <div className="flex items-center space-x-4">
          <div className="text-sm font-mono">{user?.email}</div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              // Call logout from auth context
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
            className={`p-2 rounded-full transition-colors ml-2 ${darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-200 hover:bg-red-300'}`}
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging || selectedEventIds.size === 0}
            className={`px-3 py-1 rounded disabled:opacity-50 transition-colors ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Acknowledge selected alerts
          </button>
          <button
            onClick={handleExportCSV}
            className={`px-3 py-1 rounded transition-colors ${darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            Export CSV
          </button>
          <button
            onClick={() => setFilters({
              start: '',
              end: '',
              severity: [],
              event_type: [],
              user_email: '',
              ip: '',
              resource: '',
            })}
            className={`px-3 py-1 rounded transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
          >
            Clear filters
          </button>
        </div>
      </header>

      <div className="flex space-x-4">
        {/* Left: Filters & Quick Stats */}
        <aside className={`w-1/4 p-4 rounded-lg shadow space-y-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div>
            <h2 className="font-semibold mb-2">Filters</h2>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Date Range</label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={(e) => handleFilterChange('start', e.target.value)}
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                <input
                  type="date"
                  value={filters.end}
                  onChange={(e) => handleFilterChange('end', e.target.value)}
                  className={`w-full border rounded px-2 py-1 mt-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Severity</label>
                <select
                  multiple
                  value={filters.severity}
                  onChange={(e) =>
                    handleFilterChange(
                      'severity',
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {SEVERITIES.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Event Type</label>
                <select
                  multiple
                  value={filters.event_type}
                  onChange={(e) =>
                    handleFilterChange(
                      'event_type',
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">User Email</label>
                <input
                  type="text"
                  value={filters.user_email}
                  onChange={(e) => handleFilterChange('user_email', e.target.value)}
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">IP Address</label>
                <input
                  type="text"
                  value={filters.ip}
                  onChange={(e) => handleFilterChange('ip', e.target.value)}
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                  placeholder="e.g. 192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Resource</label>
                <input
                  type="text"
                  value={filters.resource}
                  onChange={(e) => handleFilterChange('resource', e.target.value)}
                  className={`w-full border rounded px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                  placeholder="/api/v1/auth/login"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Quick Stats</h2>
            <ul className="space-y-1 text-sm">
              <li>Total events: {total}</li>
              <li>Critical alerts: {events.filter(e => e.severity === 'critical').length}</li>
              <li>Failed logins: {events.filter(e => e.event_type === 'failed_login').length}</li>
              <li>Sessions active: {/* Placeholder */}0</li>
              <li>Anomalies detected: {/* Placeholder */}0</li>
            </ul>
          </div>
        </aside>

        {/* Center: Activity timeline/table */}
        <main className={`flex-1 p-4 rounded-lg shadow overflow-auto max-h-[80vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <table className={`min-w-full border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
            <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <tr>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="checkbox"
                    checked={selectedEventIds.size === events.length && events.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEventIds(new Set(events.map(ev => ev.id)));
                      } else {
                        setSelectedEventIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Timestamp</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Event Type</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>User</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>IP</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Device/Browser</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Resource</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Summary</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Severity</th>
                <th className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <React.Fragment key={event.id}>
                  <tr
                    className={`cursor-pointer transition-colors duration-200 hover:bg-opacity-50 ${event.severity === 'critical' ? (darkMode ? 'bg-red-900' : 'bg-red-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(event.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectEvent(event.id);
                        }}
                      />
                    </td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{new Date(event.timestamp).toLocaleString()}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.event_type}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.user_email}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.ip}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.device}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.resource}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.summary}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{event.severity}</td>
                    <td className={`p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} space-x-1`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className={`px-2 py-1 rounded transition-colors ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Investigate action
                          alert('Investigate action not implemented yet');
                        }}
                        className={`px-2 py-1 rounded transition-colors ${darkMode ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                      >
                        Investigate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Mark benign action
                          alert('Mark benign action not implemented yet');
                        }}
                        className={`px-2 py-1 rounded transition-colors ${darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        Mark Benign
                      </button>
                    </td>
                  </tr>
                  {selectedEvent && selectedEvent.id === event.id && (
                    <tr>
                      <td colSpan={10} className={`p-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                        <pre className={`whitespace-pre-wrap max-h-64 overflow-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                        {event.server_logs && (
                          <>
                            <h4 className="mt-2 font-semibold">Server Logs</h4>
                            <pre className={`whitespace-pre-wrap max-h-64 overflow-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {event.server_logs}
                            </pre>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={10} className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="mt-2 flex justify-between items-center">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded disabled:opacity-50 transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'}`}
            >
              Previous
            </button>
            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
              Page {page} / {Math.ceil(total / perPage)}
            </span>
            <button
              onClick={() => setPage((p) => (p * perPage < total ? p + 1 : p))}
              disabled={page * perPage >= total}
              className={`px-3 py-1 rounded disabled:opacity-50 transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'}`}
            >
              Next
            </button>
          </div>
        </main>

        {/* Right: AI Assistant & Incident Details */}
        <aside className={`w-1/3 p-4 rounded-lg shadow space-y-4 max-h-[80vh] overflow-auto transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="font-semibold mb-2">AI Assistant</h2>
          <textarea
            readOnly
            value={aiAnalysis}
            className={`w-full h-48 border rounded p-2 resize-none transition-colors duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
          />
          {selectedEvent && (
            <>
              <h3 className="font-semibold mt-4">Incident Details</h3>
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {selectedEvent.id}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedEvent.timestamp).toLocaleString()}</div>
                <div><strong>User Email:</strong> {selectedEvent.user_email}</div>
                <div><strong>IP:</strong> {selectedEvent.ip}</div>
                <div><strong>Resource:</strong> {selectedEvent.resource}</div>
                <div><strong>Stack Trace:</strong> <pre className="whitespace-pre-wrap max-h-32 overflow-auto">{selectedEvent.stack_trace || 'N/A'}</pre></div>
                <div><strong>Related Events:</strong> {selectedEvent.related_event_ids?.join(', ') || 'None'}</div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ITActivityDashboard;
