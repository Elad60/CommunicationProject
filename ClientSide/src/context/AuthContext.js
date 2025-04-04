import React, {createContext, useState, useEffect, useContext} from 'react';
import {authApi} from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load current user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const register = async (username, password, email) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register(username, password, email);

      if (result.success && result.user) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        return {success: true};
      } else {
        setError(result.message || 'Registration failed');
        return {success: false, message: result.message};
      }
    } catch (err) {
      console.error(err);
      setError('Registration failed');
      return {success: false, message: 'Registration failed'};
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login(username, password);

      if (result.success && result.user) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        return {success: true};
      } else {
        setError(result.message || 'Login failed');
        return {success: false, message: result.message};
      }
    } catch (err) {
      console.error(err);
      setError('Login failed');
      return {success: false, message: 'Login failed'};
    } finally {
      setLoading(false);
    }
  };

const logout = async () => {
  setLoading(true);
  try {
    await AsyncStorage.clear(); // Clears all AsyncStorage (or use removeItem('user') if only clearing user)
    setUser(null);
    console.log('Logged out and AsyncStorage cleared');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    setLoading(false);
  }
};


  return (
    <AuthContext.Provider
      value={{user, loading, error, login, register, logout}}>
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
