import axios from 'axios';

// Use relative path for same-origin API calls (frontend served by backend)
// Fallback to Render backend URL if REACT_APP_API_BASE_URL is set
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ryanmart-bacckend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper functions that wrap axios methods
export const get = (url, params = {}, config = {}) =>
  api.get(url, { ...config, params });

export const post = (url, data, config = {}) =>
  api.post(url, data, config);

export const put = (url, data, config = {}) =>
  api.put(url, data, config);

export const del = (url, config = {}) =>
  api.delete(url, config);

export default api;

