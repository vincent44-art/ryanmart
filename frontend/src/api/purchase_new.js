// src/api/purchase.js
import api from './api';

export const deletePurchase = (id) =>
  api.delete(`/api/purchases/${id}`);

export const fetchPurchases = (email) =>
  api.get(`/api/purchases/${email}`);

export const addPurchase = (data) =>
  api.post('/api/purchases', data);

export const clearPurchases = (email) =>
  api.delete(`/api/purchases/${email}`);

// New function to fetch all purchases (for purchasers to see all data)
export const fetchAllPurchases = () =>
  api.get('/api/purchases');
