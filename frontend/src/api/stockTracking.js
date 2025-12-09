// BASE_URL will come from REACT_APP_API_BASE_URL env var via fetch relative path
// No need to hardcode localhost anymore

export const fetchStockTracking = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const response = await fetch('/api/stock-tracking', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch stock tracking data');
    }

    return await response.json();
  } catch (error) {
    console.error('Stock tracking fetch error:', error);
    throw error;
  }
};

export const addStockTracking = async (data, token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

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
    const response = await fetch('/api/stock-tracking', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

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
  const res = await fetch('/api/stock-tracking/clear', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to clear stock tracking');
  return await res.json();
}

export const fetchStockTrackingAggregated = async (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const response = await fetch('/api/stock-tracking/aggregated', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch aggregated data');
    }

    return await response.json();
  } catch (error) {
    console.error('Aggregated data fetch error:', error);
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
