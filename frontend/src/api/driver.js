// src/api/driver.js
import api from './api';

/**
 * Helper function to check if text is HTML
 */
const isHtmlResponse = (text) => {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || 
         trimmed.startsWith('<html') || 
         trimmed.startsWith('<!html');
};

/**
 * Fetch all expenses for a specific driver
 * @param {string} driverEmail - Email of the driver
 * @returns {Promise<Array>} - Array of expense objects
 */
export const fetchDriverExpenses = async (driverEmail) => {
  try {
    const encodedEmail = encodeURIComponent(driverEmail);
    const response = await api.get(`/api/drivers/${encodedEmail}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver expenses:', error);
    // Check if response is HTML (server error page)
    if (error.response?.data && typeof error.response.data === 'string' && isHtmlResponse(error.response.data)) {
      throw new Error('Server returned an error page. Please try again later.');
    }
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch expenses');
  }
};

/**
 * Add a new expense for a driver
 * @param {Object} expenseData - Expense details
 * @param {string} expenseData.type - Type of expense (fuel, repair, etc.)
 * @param {string} expenseData.description - Expense description
 * @param {number} expenseData.amount - Expense amount
 * @param {string} expenseData.date - Expense date (YYYY-MM-DD)
 * @param {string} expenseData.driverEmail - Driver's email
 * @returns {Promise<Object>} - The created expense object
 */
export const addDriverExpense = async (expenseData) => {
  try {
    const response = await api.post('/api/drivers/expenses', expenseData);
    return response.data;
  } catch (error) {
    console.error('Error adding driver expense:', error);
    throw new Error(error.response?.data?.message || 'Failed to add expense');
  }
};

/**
 * Update an existing driver expense
 * @param {string} expenseId - ID of the expense to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated expense object
 */
export const updateDriverExpense = async (expenseId, updates) => {
  try {
    const response = await api.patch(`/api/drivers/expenses/${expenseId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating driver expense:', error);
    throw new Error(error.response?.data?.message || 'Failed to update expense');
  }
};

/**
 * Delete a driver expense
 * @param {string} expenseId - ID of the expense to delete
 * @returns {Promise<Object>} - Confirmation message
 */
export const deleteDriverExpense = async (expenseId) => {
  try {
    const response = await api.delete(`/api/drivers/expenses/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting driver expense:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete expense');
  }
};

/**
 * Fetch driver profile information
 * @param {string} driverEmail - Email of the driver
 * @returns {Promise<Object>} - Driver profile object
 */
export const fetchDriverProfile = async (driverEmail) => {
  try {
    const encodedEmail = encodeURIComponent(driverEmail);
    const response = await api.get(`/api/drivers/${encodedEmail}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

/**
 * Update driver profile information
 * @param {string} driverEmail - Email of the driver
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated driver profile
 */
export const updateDriverProfile = async (driverEmail, updates) => {
  try {
    const encodedEmail = encodeURIComponent(driverEmail);
    const response = await api.patch(`/api/drivers/${encodedEmail}/profile`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating driver profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};
