import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gvehicle_token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
          }
        } catch (err) {
          console.error('Session restoration failed:', err);
          localStorage.removeItem('gvehicle_token');
          localStorage.removeItem('gvehicle_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      const userData = res.data.data;
      localStorage.setItem('gvehicle_token', userData.token);
      localStorage.setItem('gvehicle_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const logout = () => {
    localStorage.removeItem('gvehicle_token');
    localStorage.removeItem('gvehicle_user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
