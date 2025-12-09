// src/api/driver.js
import api from './api';

/**
 * Fetch all expenses for a specific driver
 * @param {string} driverEmail - Email of the driver
 * @returns {Promise<Array>} - Array of expense objects
 */
export const fetchDriverExpenses = async (driverEmail) => {
  try {
    const response = await api.get(`/drivers/${driverEmail}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver expenses:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
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
    const response = await api.post('/drivers/expenses', expenseData);
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
    const response = await api.patch(`/drivers/expenses/${expenseId}`, updates);
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
    const response = await api.delete(`/drivers/expenses/${expenseId}`);
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
    const response = await api.get(`/drivers/${driverEmail}/profile`);
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
    const response = await api.patch(`/drivers/${driverEmail}/profile`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating driver profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};