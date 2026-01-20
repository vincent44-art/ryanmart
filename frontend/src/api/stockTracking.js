// BASE_URL will come from REACT_APP_API_BASE_URL env var via fetch relative path
// No need to hardcode localhost anymore

// Get API base URL for debugging - same logic as axios.js
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://ryanmart-backend.onrender.com';
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Check if the response is HTML (like a 404 page)
 */
const isHtmlResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    // Check for HTML indicators
    if (text.trim().startsWith('<!') || text.includes('<html')) {
      return { isHtml: true, text };
    }
    return { isHtml: false, text };
  }
  return { isHtml: false };
};

export const fetchStockTracking = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const endpoint = '/api/stock-tracking';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if response is HTML (error page)
    const htmlCheck = await isHtmlResponse(response);
    if (htmlCheck.isHtml) {
      console.error('Stock tracking fetch error: Server returned HTML (possibly 404).', 
        'URL:', fullUrl, 'Endpoint:', endpoint);
      throw new Error(`Server returned HTML page instead of JSON. The API endpoint "${endpoint}" may not be registered or backend is not running. URL: ${fullUrl}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch stock tracking data (status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Stock tracking fetch error:', error);
    // Add more context to the error
    if (error.message.includes('HTML')) {
      throw new Error(`Stock tracking API error: ${error.message}`);
    }
    throw error;
  }
};

export const addStockTracking = async (data, token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const endpoint = '/api/stock-tracking';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  // Validate required fields based on backend model
  // For stock out (update), stockInId is required; for stock in (create), stockName, dateIn, fruitType, quantityIn are required
  let requiredFields;
  if (data.stockInId) {
    // Stock out - updating existing record
    requiredFields = ['stockInId', 'dateOut'];
  } else {
    // Stock in - creating new record
    requiredFields = ['stockName', 'dateIn', 'fruitType', 'quantityIn'];
  }

  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Stock tracking creation/update error: Expected JSON but got:', 
        text.substring(0, 200), 'URL:', fullUrl);
      throw new Error(`Server returned non-JSON response. Check API endpoint. URL: ${fullUrl}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create/update stock tracking record');
    }

    return await response.json();
  } catch (error) {
    console.error('Stock tracking creation/update error:', error);
    throw error;
  }
};

export async function clearStockTracking(token) {
  const endpoint = '/api/stock-tracking/clear';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  // Check content type to avoid parsing HTML as JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Clear stock tracking error: Expected JSON but got:', 
      text.substring(0, 200), 'URL:', fullUrl);
    throw new Error(`Server returned non-JSON response. Check API endpoint. URL: ${fullUrl}`);
  }

  if (!res.ok) throw new Error('Failed to clear stock tracking');
  return await res.json();
}

export const fetchStockTrackingAggregated = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const endpoint = '/api/stock-tracking/aggregated';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if response is HTML (error page)
    const htmlCheck = await isHtmlResponse(response);
    if (htmlCheck.isHtml) {
      console.error('Aggregated data fetch error: Server returned HTML (possibly 404).', 
        'URL:', fullUrl, 'Endpoint:', endpoint);
      throw new Error(`Server returned HTML page instead of JSON. The API endpoint "${endpoint}" may not be registered or backend is not running. URL: ${fullUrl}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch aggregated data (status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Aggregated data fetch error:', error);
    // Add more context to the error
    if (error.message.includes('HTML')) {
      throw new Error(`Aggregated data API error: ${error.message}`);
    }
    throw error;
  }
};

export const fetchSales = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const response = await fetch('/api/sales', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Sales fetch error: Expected JSON but got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Check API endpoint.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch sales data');
    }

    return await response.json();
  } catch (error) {
    console.error('Sales fetch error:', error);
    throw error;
  }
};
