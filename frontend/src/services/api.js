import axios from 'axios';

// =====================================================================
// API CONFIGURATION - CRITICAL: MATCH EXACT DEPLOYED BACKEND URL
// =====================================================================
// Production URLs (must match exactly what's deployed on Render):
// - Frontend: https://ryanmart-frontend.onrender.com
// - Backend:  https://ryanmart-backend.onrender.com
//
// Development URLs:
// - Frontend: http://localhost:3000 or http://localhost:5173
// - Backend:  http://localhost:5000

const getApiBaseUrl = () => {
  // Check for production environment variable first
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Check if we're in production (React app built for production)
  if (process.env.NODE_ENV === 'production') {
    // Return exact production backend URL
    return 'https://ryanmart-backend.onrender.com';
  }
  
  // Development fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

console.log(`[API] Initializing with base URL: ${API_BASE_URL}`);
console.log(`[API] Environment: ${process.env.NODE_ENV}`);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Required for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,  // 30 second timeout
});

// =====================================================================
// REQUEST INTERCEPTOR - ADD AUTH TOKEN
// =====================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Safe wrapper for API calls with error handling
 * Returns { success: true, data: ... } or { success: false, error: ... }
 */
export const safeApiCall = async (apiFn) => {
  try {
    const response = await apiFn();
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error('[API] safeApiCall error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred',
      status: error.response?.status,
      isHtmlResponse: error.isHtmlResponse,
      isNetworkError: error.isNetworkError,
    };
  }
};

/**
 * Check if the backend is healthy
 */
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return {
      healthy: response.data?.success === true,
      message: response.data?.message,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message || 'Backend unreachable',
    };
  }
};

// =====================================================================
// EXPORT AXIOS INSTANCE & HELPERS
// =====================================================================

export const get = (url, params = {}, config = {}) =>
  api.get(url, { ...config, params });

export const post = (url, data, config = {}) =>
  api.post(url, data, config);

export const put = (url, data, config = {}) =>
  api.put(url, data, config);

export const patch = (url, data, config = {}) =>
  api.patch(url, data, config);

export const del = (url, config = {}) =>
  api.delete(url, config);

export const head = (url, config = {}) =>
  api.head(url, config);

// Export base URL for reference
export const API_BASE_URL_CONSTANT = API_BASE_URL;

export default api;

