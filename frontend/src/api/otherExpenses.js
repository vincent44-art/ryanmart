// Use relative paths — the proxy/backend will be set via REACT_APP_API_BASE_URL env var
const API_BASE_URL = '/api';

export const fetchOtherExpenses = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/other_expenses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Get raw response text for debugging
  const text = await response.text();
  console.log('fetchOtherExpenses - Raw response:', text);

  let result;
  try {
    result = JSON.parse(text);
  } catch (parseErr) {
    throw new Error(`Invalid JSON response: ${text || 'empty response'}`);
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || `Server error (${response.status})`);
  }

  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch other expenses');
  }

  return result.data;
};

export const addOtherExpense = async (expenseData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/other_expenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(expenseData)
  });

  // Get raw response text for debugging
  const text = await response.text();
  console.log('addOtherExpense - Raw response:', text);

  let result;
  try {
    result = JSON.parse(text);
  } catch (parseErr) {
    throw new Error(`Invalid JSON response: ${text || 'empty response'}`);
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || `Server error (${response.status})`);
  }

  if (!result.success) {
    throw new Error(result.message || 'Failed to add other expense');
  }

  return result.data;
};

export const deleteOtherExpense = async (expenseId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/other_expenses/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Get raw response text for debugging
  const text = await response.text();
  console.log('deleteOtherExpense - Raw response:', text);

  // Handle empty response (204 No Content)
  if (!text || text.trim() === '') {
    if (response.ok) {
      return { success: true, message: 'Expense deleted successfully' };
    }
    throw new Error(`Server error (${response.status})`);
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch (parseErr) {
    if (response.ok) {
      return { success: true, message: 'Expense deleted successfully' };
    }
    throw new Error(`Invalid JSON response: ${text}`);
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || `Server error (${response.status})`);
  }

  if (!result.success) {
    throw new Error(result.message || 'Failed to delete other expense');
  }

  return result;
};
