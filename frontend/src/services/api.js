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

const API_BASE_URL = getApiBaseUrl();

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
    import axios from 'axios';

    // Small, reliable axios wrapper for RyanMart frontend
    // - Normalizes paths so components may call either '/car-expenses' or '/api/car-expenses'
    // - Defaults API_BASE_URL to '', allowing same-origin calls when frontend served by backend
    // - Honors REACT_APP_API_BASE_URL when provided (e.g., https://ryanmart-backend.onrender.com)

    const getApiBaseUrl = () => {
      const env = process.env.REACT_APP_API_BASE_URL;
      if (env !== undefined) return env;
      // Default to same-origin (no host) so relative calls work when frontend is served by backend
      return '';
    };

    export const API_BASE_URL = getApiBaseUrl();

    const api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 30000,
    });

    api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Detect HTML responses for API calls and fail early
    api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error && error.response) {
          const ct = error.response.headers['content-type'] || '';
          if (!ct.includes('application/json') && ct.includes('text/html')) {
            const e = new Error('Server returned HTML instead of JSON');
            e.isHtmlResponse = true;
            e.response = error.response;
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      }
    );

    function normalizeUrl(url) {
      if (!url) return url;
      if (/^https?:\/\//i.test(url)) return url; // absolute URL
      if (url.startsWith('/api/')) return url;
      if (url === '/api') return url;
      if (url.startsWith('/')) return `/api${url}`;
      return `/api/${url}`;
    }

    export const get = (url, params = {}, config = {}) => api.get(normalizeUrl(url), { params, ...config });
    export const post = (url, data = {}, config = {}) => api.post(normalizeUrl(url), data, config);
    export const put = (url, data = {}, config = {}) => api.put(normalizeUrl(url), data, config);
    export const patch = (url, data = {}, config = {}) => api.patch(normalizeUrl(url), data, config);
    export const del = (url, config = {}) => api.delete(normalizeUrl(url), config);
    export const head = (url, config = {}) => api.head(normalizeUrl(url), config);

    export const safeApiCall = async (fn) => {
      try {
        const res = await fn();
        return { success: true, data: res.data, status: res.status };
      } catch (err) {
        return { success: false, error: err.message || 'API error', status: err.response?.status, isHtmlResponse: err.isHtmlResponse };
      }
    };

    export default api;
            localStorage.setItem('access_token', access_token);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
      }
      
      // Clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject({
        ...error,
        message: 'Session expired. Please log in again.',
        redirectToLogin: true,
      });
    }
    
    // Handle non-JSON responses (HTML error pages)
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      
      if (!contentType.includes('application/json')) {
        // Backend returned HTML (probably an error page)
        console.error('[API] Backend returned non-JSON response:', error.response.data?.substring?.(0, 200));
        
        // Create a more descriptive error
        const errorMessage = error.response.status === 404 
          ? 'API endpoint not found. Please check the URL.'
          : error.response.status === 500
            ? 'Server error. Please try again later.'
            : `Unexpected response from server (${error.response.status})`;
        
        return Promise.reject({
          ...error,
          isHtmlResponse: true,
          message: errorMessage,
          originalStatus: error.response.status,
        });
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        message: 'Request timed out. Please try again.',
        isNetworkError: true,
      });
    }
    
    if (!window.navigator.onLine) {
      return Promise.reject({
        ...error,
        message: 'You are offline. Please check your internet connection.',
        isNetworkError: true,
      });
    }
    
    // Return the original error for other cases
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

