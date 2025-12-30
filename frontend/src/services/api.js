 // // import axios from 'axios';

// // /**
// //  * Configure axios instance with base settings
// //  * @type {import('axios').AxiosInstance}
// //  */
// // const api = axios.create({
// //   baseURL: process.env.NODE_ENV === 'development'
// //     ? 'http://localhost:5000/api'
// //     : '/api',
// //   withCredentials: true,
// //   headers: {
// //     'Content-Type': 'application/json',
// //     'Accept': 'application/json'
// //   },
// //   timeout: 10000 // 10 seconds timeout
// // });

// // // Current active refresh token request
// // let refreshTokenRequest = null;

// // /**
// //  * Request interceptor for adding auth token and handling requests
// //  */
// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem('access_token');
// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }

// //     // Add cache-buster for GET requests
// //     if (config.method === 'get') {
// //       config.params = {
// //         ...config.params,
// //         _t: Date.now()
// //       };
// //     }

// //     // Add abort controller if not provided
// //     if (!config.signal) {
// //       const controller = new AbortController();
// //       config.signal = controller.signal;
// //       config.abortController = controller; // Store for external access
// //     }

// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // /**
// //  * Response interceptor for handling responses and errors
// //  */
// // api.interceptors.response.use(
// //   (response) => {
// //     // Store new access token if provided
// //     if (response.data?.access_token) {
// //       localStorage.setItem('access_token', response.data.access_token);
// //     }
// //     return response.data || response;
// //   },
// //   async (error) => {
// //     const originalRequest = error.config;
    
// //     // Handle token refresh (401 status)
   

// //     // Handle other errors
// //     const errorResponse = {
// //       status: error.response?.status || 0,
// //       message: error.response?.data?.message || 
// //                error.message || 
// //                'Network Error',
// //       data: error.response?.data,
// //       code: error.code,
// //       isAxiosError: error.isAxiosError,
// //       config: error.config
// //     };

// //     // Specific error handling
// //     switch (errorResponse.status) {
// //       case 403:
// //         window.location.href = '/unauthorized';
// //         break;
// //       case 404:
// //         console.error('Resource not found:', originalRequest.url);
// //         break;
// //       case 500:
// //         console.error('Server error:', errorResponse.message);
// //         break;
// //       default:
// //         console.error('API Error:', errorResponse);
// //     }

// //     return Promise.reject(errorResponse);
// //   }
// // );

// // /**
// //  * API Helper Functions
// //  */

// // /**
// //  * GET request with params
// //  * @param {string} url 
// //  * @param {object} params 
// //  * @param {import('axios').AxiosRequestConfig} config 
// //  * @returns {Promise<any>}
// //  */
// // export const get = (url, params = {}, config = {}) => 
// //   api.get(url, { ...config, params });

// // /**
// //  * POST request with data
// //  * @param {string} url 
// //  * @param {object} data 
// //  * @param {import('axios').AxiosRequestConfig} config 
// //  * @returns {Promise<any>}
// //  */
// // export const post = (url, data, config = {}) => 
// //   api.post(url, data, config);

// // /**
// //  * PUT request with data
// //  * @param {string} url 
// //  * @param {object} data 
// //  * @param {import('axios').AxiosRequestConfig} config 
// //  * @returns {Promise<any>}
// //  */
// // export const put = (url, data, config = {}) => 
// //   api.put(url, data, config);

// // /**
// //  * DELETE request
// //  * @param {string} url 
// //  * @param {import('axios').AxiosRequestConfig} config 
// //  * @returns {Promise<any>}
// //  */
// // export const del = (url, config = {}) => 
// //   api.delete(url, config);

// // /**
// //  * Cancel all pending requests
// //  */
// // export const cancelAllRequests = () => {
// //   // This would require tracking all controllers in a real implementation
// //   console.warn('cancelAllRequests: Implement controller tracking for full functionality');
// // };

// // export default api;


// import axios from 'axios';
// import { toast } from 'react-hot-toast';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Create single axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json'
//   },
//   timeout: 10000 // 10 seconds
// });

// // ===== REQUEST INTERCEPTOR =====
// api.interceptors.request.use(
//   (config) => {
//     // Attach token if available
//     const token = localStorage.getItem('access_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // Add cache-buster for GET requests
//     if (config.method === 'get') {
//       config.params = {
//         ...config.params,
//         _t: Date.now()
//       };
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ===== RESPONSE INTERCEPTOR =====
// api.interceptors.response.use(
//   (response) => {
//     // If API sends new token, update it
//     if (response.data?.access_token) {
//       localStorage.setItem('access_token', response.data.access_token);
//     }
//     return response;
//   },
//   (error) => {
//     const originalRequest = error.config;
//     const status = error.response?.status || 0;
//     const message = error.response?.data?.message || error.message || 'Network Error';

//     // Handle Unauthorized (401) → force logout
//     if (status === 401) {
//       localStorage.removeItem('access_token');
//       toast.error('Session expired. Please login again.');
//       window.location.href = '/login';
//     }

//     // Handle Forbidden (403)
//     if (status === 403) {
//       toast.error('Unauthorized access');
//       window.location.href = '/unauthorized';
//     }

//     if (status === 404) {
//       console.error('Resource not found:', originalRequest.url);
//     }

//     if (status === 500) {
//       console.error('Server error:', message);
//       toast.error('Server error. Please try again later.');
//     }

//     return Promise.reject(error);
//   }
// );

// // ===== HELPER METHODS =====
// export const get = (url, params = {}, config = {}) => api.get(url, { ...config, params });
// export const post = (url, data, config = {}) => api.post(url, data, config);
// export const put = (url, data, config = {}) => api.put(url, data, config);
// export const del = (url, config = {}) => api.delete(url, config);

// export default api;
import axios from 'axios';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ryanmart.store/api';

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
