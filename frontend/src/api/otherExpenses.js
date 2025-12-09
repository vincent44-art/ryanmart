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

  if (!response.ok) {
    throw new Error('Failed to fetch other expenses');
  }

  const result = await response.json();
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

  if (!response.ok) {
    throw new Error('Failed to add other expense');
  }

  const result = await response.json();
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

  if (!response.ok) {
    throw new Error('Failed to delete other expense');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to delete other expense');
  }

  return result;
};
