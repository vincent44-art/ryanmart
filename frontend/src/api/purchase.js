// src/api/purchase.js
import api from './api';

export const deletePurchase = (id) =>
  api.delete(`/api/purchases/${id}`);

export const fetchPurchases = (email = null) => {
  if (email) {
    return api.get(`/api/purchases/by-email?email=${encodeURIComponent(email)}`);
  } else {
    return api.get('/api/purchases');
  }
};

export const addPurchase = (data) =>
  api.post('/api/purchases', data);

export const clearPurchases = (email) =>
  api.delete(`/api/purchases/${email}`);
