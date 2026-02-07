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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
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

