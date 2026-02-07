/**
 * Spolige API Helper Functions
 * Manages spoilage/spolige records for fruits
 */

const API_BASE = '/api';

/**
 * Get the authentication token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token');
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Check content type to determine if response is JSON
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      // If JSON parsing fails, create a structured error
      console.error('Error parsing JSON response:', e);
      throw new Error('Invalid JSON response from server');
    }
  } else {
    // Non-JSON response (likely HTML error page)
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 500));
    
    // Try to extract error info from the response
    if (response.status === 404) {
      throw new Error('API endpoint not found (404)');
    } else if (response.status === 500) {
      throw new Error('Server error (500): Internal server error');
    } else if (response.status === 401) {
      throw new Error('Unauthorized: Please log in again');
    } else if (response.status === 403) {
      throw new Error('Forbidden: You do not have permission');
    } else {
      throw new Error(`API request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `API request failed with status ${response.status}`);
  }

  return { data };
};

/**
 * Fetch all spolige records
 */
export const fetchSpolige = async () => {
  try {
    const result = await apiRequest('/spolige');
    return {
      success: true,
      data: result.data?.data || result.data || [],
    };
  } catch (error) {
    console.error('Error fetching spolige:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Create a new spolige record
 */
export const createSpolige = async (spoligeData) => {
  try {
    const result = await apiRequest('/spolige', {
      method: 'POST',
      body: JSON.stringify(spoligeData),
    });
    return {
      success: true,
      data: result.data?.data || result.data,
    };
  } catch (error) {
    console.error('Error creating spolige:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update an existing spolige record
 */
export const updateSpolige = async (id, spoligeData) => {
  try {
    const result = await apiRequest(`/spolige/${id}`, {
      method: 'PUT',
      body: JSON.stringify(spoligeData),
    });
    return {
      success: true,
      data: result.data?.data || result.data,
    };
  } catch (error) {
    console.error('Error updating spolige:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete a spolige record
 */
export const deleteSpolige = async (id) => {
  try {
    const result = await apiRequest(`/spolige/${id}`, {
      method: 'DELETE',
    });
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error deleting spolige:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Clear all spolige records (CEO/Admin only)
 */
export const clearAllSpolige = async () => {
  try {
    const result = await apiRequest('/spolige/clear', {
      method: 'DELETE',
    });
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error clearing spolige:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  fetchSpolige,
  createSpolige,
  updateSpolige,
  deleteSpolige,
  clearAllSpolige,
};

