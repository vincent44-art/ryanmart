import api from './api';

// Fetch all seller fruits
export const fetchSellerFruits = async (token = null) => {
  try {
  console.log('fetchSellerFruits: Making API call to /api/seller-fruits');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.get('/seller-fruits', config);
    console.log('fetchSellerFruits: Response received:', response);
    return response.data;
  } catch (error) {
    console.error('fetchSellerFruits: API call failed:', error);
    throw error;
  }
};

// Create a new seller fruit
export const createSellerFruit = async (fruitData, token = null) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.post('/seller-fruits', fruitData, config);
    console.log('createSellerFruit: Response received:', response);
    return response.data;
  } catch (error) {
    console.error('createSellerFruit: API call failed:', error);
    throw error;
  }
};

// Update a seller fruit
export const updateSellerFruit = async (fruitId, fruitData) => {
  const response = await api.put(`/seller-fruits/${fruitId}`, fruitData);
  return response.data;
};

// Delete a seller fruit
export const deleteSellerFruit = async (fruitId, token = null) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.delete(`/seller-fruits/${fruitId}`, config);
    console.log('deleteSellerFruit: Response received:', response);
    return response.data;
  } catch (error) {
    console.error('deleteSellerFruit: API call failed:', error);
    throw error;
  }
};
