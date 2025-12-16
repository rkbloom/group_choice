import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

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
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);
      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (data) => {
    try {
      setError(null);
      await authAPI.register(data);

      // Auto-login after registration
      return await login(data.email, data.password);
    } catch (err) {
      const message = err.response?.data || 'Registration failed. Please try again.';
      setError(typeof message === 'string' ? message : Object.values(message).flat().join(' '));
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      return { success: true };
    } catch (err) {
      const message = err.response?.data || 'Update failed.';
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.permission_level === 'admin' || user?.permission_level === 'super',
    isSuper: user?.permission_level === 'super',
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
