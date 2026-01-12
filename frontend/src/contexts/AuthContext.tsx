import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import api from '../api/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'purchaser' | 'seller' | 'driver' | 'storekeeper' | 'it' | 'admin';
  status: 'active' | 'blocked';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => boolean;
  updateUser: (id: string, updates: Partial<User>) => boolean;
  deleteUser: (id: string) => boolean;
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('fruittrack_user');
    const savedToken = localStorage.getItem('access_token');
    const savedRefreshToken = localStorage.getItem('refresh_token');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }

    // Initialize CEO if no users exist
    const users = JSON.parse(localStorage.getItem('fruittrack_users') || '[]');
    if (users.length === 0) {
      const ceoUser: User = {
        id: 'ceo-001',
        name: 'CEO Admin',
        email: 'ceo@fruittrack.com',
        role: 'ceo',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('fruittrack_users', JSON.stringify([ceoUser]));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
  // Call the canonical API path explicitly so the request targets /api/auth/login
  const base = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
  const url = base ? `${base}/api/auth/login` : '/api/auth/login';
  const response = await api.post(url, { email, password });

      if (response.data.success) {
        const user = response.data.data.user;
        const token = response.data.data.access_token;
        const refreshToken = response.data.data.refresh_token;

        setUser(user);
        setToken(token);
        setRefreshToken(refreshToken);
        localStorage.setItem('fruittrack_user', JSON.stringify(user));
        localStorage.setItem('access_token', token); // Store JWT token
        localStorage.setItem('refresh_token', refreshToken); // Store refresh token
        toast.success(`Welcome back, ${user.name}!`);
        return true;
      } else {
        toast.error(response.data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('fruittrack_user');
    localStorage.removeItem('access_token'); // Remove JWT token
    localStorage.removeItem('refresh_token'); // Remove refresh token
    toast.success('Logged out successfully');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('fruittrack_users') || '[]');

    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      toast.error('User with this email already exists');
      return false;
    }

    // Validate email contains role
    const emailLower = userData.email.toLowerCase();
    if (userData.role !== 'ceo' && !emailLower.includes(userData.role)) {
      toast.error(`Email must contain "${userData.role}" for this role`);
      return false;
    }

    const newUser: User = {
      ...userData,
      id: `${userData.role}-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('fruittrack_users', JSON.stringify(users));
    toast.success(`User ${newUser.name} added successfully`);
    return true;
  };

  const updateUser = (id: string, updates: Partial<User>): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('fruittrack_users') || '[]');
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) return false;

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem('fruittrack_users', JSON.stringify(users));

    // Update current user if it's the same user
    if (user && user.id === id) {
      setUser(users[userIndex]);
      localStorage.setItem('fruittrack_user', JSON.stringify(users[userIndex]));
    }

    return true;
  };

  const deleteUser = (id: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('fruittrack_users') || '[]');
    const filteredUsers = users.filter(u => u.id !== id);
    localStorage.setItem('fruittrack_users', JSON.stringify(filteredUsers));
    toast.success('User deleted successfully');
    return true;
  };

  const getAllUsers = (): User[] => {
    return JSON.parse(localStorage.getItem('fruittrack_users') || '[]');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      refreshToken,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      getAllUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};
