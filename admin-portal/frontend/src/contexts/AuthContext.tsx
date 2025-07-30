import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { adminApi } from '../services/adminApi';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const userData = await adminApi.getCurrentUser();
        setUser(userData);
        // Update localStorage with fresh user data
        localStorage.setItem('admin_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await adminApi.login({ username, password });
      localStorage.setItem('admin_token', response.access_token);
      
      // The login response now includes complete user data
      const userData = response.user as User;
      setUser(userData);
      localStorage.setItem('admin_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    adminApi.logout().catch(console.error); // Don't wait for logout API call
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      // Merge the new data with existing user data
      const updatedUser = { ...prevUser, ...userData };
      
      // Update localStorage with the new user data
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      
      // Return the updated user
      return updatedUser;
    });
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
