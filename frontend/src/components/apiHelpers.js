import api from '../api/api';

// API Helper Functions

// Fetch inventory data
export const fetchInventory = async (token = null) => {
  try {
    const response = await api.get('/inventory');
    return response;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

// Fetch stock movements
export const fetchStockMovements = async (token = null) => {
  try {
    const response = await api.get('/stock-movements');
    return response;
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    throw error;
  }
};

// Fetch purchases data
export const fetchPurchases = async (userEmail = null) => {
  try {
    const endpoint = userEmail ? `/purchases/${userEmail}` : '/purchases';
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

// Helper function to check if text is HTML
const isHtmlResponse = (text) => {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || 
         trimmed.startsWith('<html') || 
         trimmed.startsWith('<!html');
};

// Fetch sales data
export const fetchSales = async (userEmail = null) => {
  try {
    const endpoint = userEmail ? `/sales/${userEmail}` : '/sales';
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching sales:', error);
    // Check if response is HTML (server error page)
    if (error.response?.data && typeof error.response.data === 'string' && isHtmlResponse(error.response.data)) {
      throw new Error('Server returned an error page. Please try again later.');
    }
    throw error;
  }
};

// Fetch other expenses
export const fetchOtherExpenses = async () => {
  try {
  const response = await api.get('/other_expenses');
    return response;
  } catch (error) {
    console.error('Error fetching other expenses:', error);
    throw error;
  }
};

// Fetch users data
export const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create a new sale
export const createSale = async (saleData) => {
  try {
    const response = await api.post('/sales', saleData);
    return response;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

// Delete a sale
export const deleteSale = async (saleId) => {
  try {
    const response = await api.delete(`/sales/${saleId}`);
    return response;
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

// Create assignment
export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/assignments', assignmentData);
    return response;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

// Create sale for assignment
export const createSaleForAssignment = async (assignmentId, saleData) => {
  try {
    const response = await api.post(`/assignments/${assignmentId}/sales`, saleData);
    return response;
  } catch (error) {
    console.error('Error creating sale for assignment:', error);
    throw error;
  }
};

// Delete purchase
export const deletePurchase = async (purchaseId) => {
  try {
    const response = await api.delete(`/purchases/${purchaseId}`);
    return response;
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
};

// Add purchase
export const addPurchase = async (purchaseData) => {
  try {
    const response = await api.post('/purchases', purchaseData);
    return response;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

// Add user
export const addUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Fetch car expenses
export const fetchCarExpenses = async () => {
  try {
    const response = await api.get('/car-expenses');
    return response;
  } catch (error) {
    console.error('Error fetching car expenses:', error);
    throw error;
  }
};

// Add car expense
export const addCarExpense = async (expenseData) => {
  try {
    const response = await api.post('/car-expenses', expenseData);
    return response;
  } catch (error) {
    console.error('Error adding car expense:', error);
    throw error;
  }
};

// Update car expense
export const updateCarExpense = async (expenseId, expenseData) => {
  try {
    const response = await api.put(`/car-expenses/${expenseId}`, expenseData);
    return response;
  } catch (error) {
    console.error('Error updating car expense:', error);
    throw error;
  }
};

// Delete car expense
export const deleteCarExpense = async (expenseId) => {
  try {
    const response = await api.delete(`/car-expenses/${expenseId}`);
    return response;
  } catch (error) {
    console.error('Error deleting car expense:', error);
    throw error;
  }
};

// Clear all data
export const clearAllDataAPI = async () => {
  try {
    const response = await api.delete('/clear-all');
    return response;
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Clear purchases data
export const clearPurchasesDataAPI = async () => {
  try {
    const response = await api.delete('/purchases');
    return response;
  } catch (error) {
    console.error('Error clearing purchases data:', error);
    throw error;
  }
};

// Clear sales data
export const clearSalesDataAPI = async () => {
  try {
    const response = await api.delete('/sales');
    return response;
  } catch (error) {
    console.error('Error clearing sales data:', error);
    throw error;
  }
};

// Clear inventory data
export const clearInventoryDataAPI = async () => {
  try {
    const response = await api.delete('/inventory');
    return response;
  } catch (error) {
    console.error('Error clearing inventory data:', error);
    throw error;
  }
};

// Clear car expenses data
export const clearCarExpensesDataAPI = async () => {
  try {
    const response = await api.delete('/car-expenses');
    return response;
  } catch (error) {
    console.error('Error clearing car expenses data:', error);
    throw error;
  }
};

// Clear other expenses data
export const clearOtherExpensesDataAPI = async () => {
  try {
  const response = await api.delete('/other_expenses');
    return response;
  } catch (error) {
    console.error('Error clearing other expenses data:', error);
    throw error;
  }
};

// Clear salaries data
export const clearSalariesDataAPI = async () => {
  try {
    const response = await api.delete('/salaries');
    return response;
  } catch (error) {
    console.error('Error clearing salaries data:', error);
    throw error;
  }
};

// Create other expense
export const createOtherExpense = async (expenseData) => {
  try {
  const response = await api.post('/other_expenses', expenseData);
    return response;
  } catch (error) {
    console.error('Error creating other expense:', error);
    throw error;
  }
};

// Delete other expense
export const deleteOtherExpense = async (expenseId) => {
  try {
  const response = await api.delete(`/other_expenses/${expenseId}`);
    return response;
  } catch (error) {
    console.error('Error deleting other expense:', error);
    throw error;
  }
};

// Fetch salaries
export const fetchSalaries = async () => {
  try {
    const response = await api.get('/salaries');
    return response;
  } catch (error) {
    console.error('Error fetching salaries:', error);
    throw error;
  }
};

// Delete salary
export const deleteSalary = async (salaryId) => {
  try {
    const response = await api.delete(`/salaries/${salaryId}`);
    return response;
  } catch (error) {
    console.error('Error deleting salary:', error);
    throw error;
  }
};
