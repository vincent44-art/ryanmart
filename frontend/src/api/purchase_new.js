// src/api/purchase.js
import api from './api';

export const deletePurchase = (id) =>
  api.delete(`/purchases/${id}`);

export const fetchPurchases = (email) =>
  api.get(`/purchases/${email}`);

export const addPurchase = (data) =>
  api.post('/purchases', data);

export const clearPurchases = (email) =>
  api.delete(`/purchases/${email}`);

// New function to fetch all purchases (for purchasers to see all data)
export const fetchAllPurchases = () =>
  api.get('/purchases');
