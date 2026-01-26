import axios from 'axios';
import { toast } from 'react-hot-toast';

// Get the base URL from environment or use default
const RAW_BASE = process.env.REACT_APP_API_BASE_URL || '';
// Use the full backend URL with /api prefix for production, or /api for local
const baseURL = RAW_BASE ? RAW_BASE + '/api' : 'https://ryanmart-bacckend.onrender.com/api';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 30000,  // 30 second timeout to match backend configuration
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to attach the access token and cache-buster
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add cache-buster for GET requests
    if (config.method === 'get' && !config.params?.noCache) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Current refresh token request to prevent multiple refresh attempts
let refreshTokenRequest = null;

// Helper function to detect HTML responses
const looksLikeHtml = (data) => {
  if (typeof data !== 'string') return false;
  const trimmed = data.trim();
  return trimmed.startsWith('<!DOCTYPE') ||
         trimmed.startsWith('<!doctype') ||
         trimmed.startsWith('<html') ||
         trimmed.startsWith('<!html');
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Check content-type header for HTML before axios parses body
    const contentType = response.headers['content-type'] || '';
    const responseData = response.data;
    
    // If content-type is HTML or data looks like HTML, reject BEFORE JSON parsing
    if (contentType.includes('text/html') ||
        (typeof responseData === 'string' && looksLikeHtml(responseData))) {
      console.error('Server returned HTML error page instead of JSON');
      console.error('Response preview:', typeof responseData === 'string' ? responseData.substring(0, 500) : responseData);
      return Promise.reject({
        status: 500,
        message: 'Server error - received HTML instead of JSON. The server may be returning a CORS error or 404 page.',
        isHtmlError: true,
        isNetworkError: false
      });
    }
    
    // Store new access token if provided in response
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle JSON parsing errors (axios tried to parse HTML as JSON)
    if (error instanceof SyntaxError && error.message.includes('Unexpected token') ||
        error.message?.includes('JSON.parse')) {
      console.error('JSON parsing error - likely received HTML instead of JSON:', error.message);
      toast.error('Server error: Received invalid response from server');
      return Promise.reject({
        status: 500,
        message: 'Server error: Invalid JSON response. The server may be returning an HTML error page.',
        isJsonParseError: true,
        isNetworkError: false
      });
    }

    // Handle network errors (CORS, server down, etc.)
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
      console.error('Network error:', error.message);
      toast.error('Network error: Cannot connect to server. Please check your connection.');
      return Promise.reject({
        status: 0,
        message: 'Network error: Cannot connect to server.',
        isNetworkError: true
      });
    }

    // Handle token refresh (401 status)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshTokenRequest = refreshTokenRequest ||
          api.post('/auth/refresh', {
            refresh_token: localStorage.getItem('refresh_token')
          }, {
            skipAuthRefresh: true,
          });

        const { data } = await refreshTokenRequest;
        localStorage.setItem('access_token', data.access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshError);
      } finally {
        refreshTokenRequest = null;
      }
    }

    // Handle specific error statuses
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data?.message || 'An error occurred';

      switch (status) {
        case 400:
          errorMessage = data?.errors?.join('\n') || 'Bad request';
          break;
        case 403:
          errorMessage = 'You are not authorized to perform this action';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error occurred';
          break;
        default:
          errorMessage = data?.message || 'An unexpected error occurred';
          break;
      }

      if (!originalRequest?.skipErrorToast) {
        toast.error(errorMessage);
      }

      return Promise.reject({
        status,
        message: errorMessage,
        errors: data?.errors,
        data: data
      });
    } else if (error.request) {
      toast.error('Network error - please check your connection');
      return Promise.reject({
        status: 0,
        message: 'No response from server'
      });
    } else {
      console.error('Request setup error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message
      });
    }
  }
);

export default api;
//         localStorage.removeItem('access_token');
//         window.location.href = '/login?session_expired=true';
//         return Promise.reject(refreshError);
//       } finally {
//         refreshTokenRequest = null;
//       }
//     }

//     // Handle specific error statuses
//     if (error.response) {
//       const { status, data } = error.response;
//       let errorMessage = data?.message || 'An error occurred';
      
//       switch (status) {
//         case 400:
//           errorMessage = data?.errors?.join('\n') || 'Bad request';
//           break;
//         case 403:
//           errorMessage = 'You are not authorized to perform this action';
//           break;
//         case 404:
//           errorMessage = 'Resource not found';
//           break;
//         case 500:
//           errorMessage = 'Server error occurred';
//           break;
//         default:
//           errorMessage = data?.message || 'An unexpected error occurred';
//           break;
//       }
      
//       // Show error toast (optional)
//       if (!originalRequest?.skipErrorToast) {
//         toast.error(errorMessage);
//       }
      
//       return Promise.reject({
//         status,
//         message: errorMessage,
//         errors: data?.errors,
//         data: data
//       });
//     } else if (error.request) {
//       // The request was made but no response was received
//       toast.error('Network error - please check your connection');
//       return Promise.reject({
//         status: 0,
//         message: 'No response from server'
//       });
//     } else {
//       // Something happened in setting up the request
//       console.error('Request setup error:', error.message);
//       return Promise.reject({
//         status: -1,
//         message: error.message
//       });
//     }
//   }
// );


// // Request interceptor to attach access token
// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem('access_token');
// //     if (token) {
// //       config.headers['Authorization'] = `Bearer ${token}`;
// //     }
// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // Temporary simplified response handling (for debugging)
// // api.interceptors.response.use(
// //   (response) => response.data,
// //   (error) => Promise.reject(error)
// // );
// export default api;
