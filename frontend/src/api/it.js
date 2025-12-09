import api from './api';

const API_BASE = '/api/it';

export async function fetchEvents(params, token) {
  const response = await api.get(`${API_BASE}/events`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function fetchEventById(eventId, token) {
  const response = await api.get(`${API_BASE}/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function acknowledgeAlerts(eventIds, token) {
  const response = await api.post(`${API_BASE}/alerts/acknowledge`, {
    event_ids: eventIds
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function fetchAlerts(params, token) {
  const response = await api.get(`${API_BASE}/alerts`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function createIncident(payload, token) {
  const response = await api.post(`${API_BASE}/incidents`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}
