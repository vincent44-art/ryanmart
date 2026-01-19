// src/api/purchase.js
import api from './api';

export const deletePurchase = (id) =>
  api.delete(`/purchases/${id}`);

export const fetchPurchases = (email = null) => {
  if (email) {
    return api.get(`/purchases/by-email/${email}`);
  } else {
    return api.get('/purchases');
  }
};

export const addPurchase = (data) =>
  api.post('/purchases', data);

export const clearPurchases = (email) =>
  api.delete(`/purchases/${email}`);
