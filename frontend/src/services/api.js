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
    return Promise.reject(error);
  }
);

// =====================================================================
// RESPONSE INTERCEPTOR - SAFE JSON PARSING & ERROR HANDLING
// =====================================================================
api.interceptors.response.use(
  // SUCCESS HANDLER
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] Response ${response.status}: ${response.config.url}`);
    }
    
    // Validate that response is actually JSON before trying to parse
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // Axios already parsed JSON, just return the response
      return response;
    } else if (response.config.responseType === 'blob') {
      // Handle blob responses (like PDF files)
      return response;
    } else {
      // Unexpected content type - this shouldn't happen for API calls
      console.warn('[API] Unexpected content-type:', contentType, 'URL:', response.config.url);
      
      // Try to parse as JSON anyway (some servers don't set content-type correctly)
      try {
        // If response.data is already an object (axios might have parsed it)
        if (typeof response.data === 'object') {
          return response;
        }
        // Try to parse string response as JSON
        const parsed = JSON.parse(response.data);
        return { ...response, data: parsed };
      } catch {
        // Return original response if parsing fails
        return response;
      }
    }
  },
  
  // ERROR HANDLER
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('[API] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refresh_token: refreshToken },
            { withCredentials: true }
          );
          
          if (refreshResponse.data.success) {
            const { access_token } = refreshResponse.data.data;
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

