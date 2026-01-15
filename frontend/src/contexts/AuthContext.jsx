import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
// import api from '../services/api';
import api from '../services/api';



const AuthContext = createContext();


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      verifyAuth();
    } else {
      setLoading(false);
    }
  }, []);


const verifyAuth = async () => {
  try {
    // Use relative path so axios baseURL is respected
    const response = await api.get('/auth/me');
    setUser(response.data.data);
  } catch (error) {
    console.error("Auth check failed:", error.response?.data || error.message);
    setUser(null);
    localStorage.removeItem('access_token');
  } finally {
    setLoading(false);
  }
};


  const login = async (email, password) => {
  try {
    // Use relative path so axios baseURL is respected (baseURL already includes /api)
    const response = await api.post('/auth/login', { email, password });
    const resData = response?.data?.data || response?.data;

    if (!resData || !resData.access_token || !resData.user) {
      throw new Error("Invalid response format");
    }

    // Save token FIRST
    localStorage.setItem('access_token', resData.access_token);
    api.defaults.headers.Authorization = `Bearer ${resData.access_token}`; // <-- Add this
    setUser(resData.user);

    toast.success('Login successful');

    // Check if first login - return flag for redirect handling
    return { success: true, isFirstLogin: resData.user.is_first_login };
  } catch (error) {
    console.error('Login error:', error);
    const errorMsg = error.response?.data?.message || 'Login failed';
    toast.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};
  


  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    toast.success('Logged out successfully');
  };


  // const loadUsers = async () => {
  //   try {
  //     const { data } = await api.get('/users');
  //     setUsers(response.data); // ✅ match backend structure
  //   } catch (error) {
  //     console.error('Failed to load users:', error);
  //     toast.error('Failed to load users');
  //     setUsers([]);
  //   }
  // };


  


  const getAllUsers = async () => {
    try {
    const { data } = await api.get('/users');
      return data.data;
    } catch (error) {
      console.error('Failed to get users:', error);
      toast.error('Failed to load users');
      return [];
    }
  };

  const addUser = async (userData) => {
    try {
  const { data } = await api.post('/users', userData);
      setUsers(prev => [...prev, data.data]);
      toast.success('User added successfully');
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add user';
      toast.error(errorMsg);
      return false;
    }
  };

  const updateUser = async (userId, updates) => {
    try {
  const { data } = await api.put(`/users/${userId}`, updates);
      setUsers(prev => prev.map(u => u.id === userId ? data.data : u));

      if (user?.id === userId) {
        setUser(data.data);
      }

      toast.success('User updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update user';
      toast.error(errorMsg);
      return false;
    }
  };

  const deleteUser = async (userId) => {
    try {
      if (user?.id === userId) {
        throw new Error("You can't delete yourself");
      }

  await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMsg);
      return false;
    }
  };

  // Add token to context value
  const token = localStorage.getItem('access_token');
  const value = {
    user,
    users,
    login,
    logout,
    loading,
    verifyAuth,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
    
   
  );
};


