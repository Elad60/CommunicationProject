import React, {createContext, useState, useEffect, useContext} from 'react';
import {authApi,groupUsersApi} from '../utils/apiService';
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

  const register = async (username, password, email, group) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register(username, password, email, group);
      console.log('Register result:', result);
  
      if (result.success) {
        if (result.user) {
          // If the server returned user data, store it and set the user
          await AsyncStorage.setItem('user', JSON.stringify(result.user));
          setUser(result.user);
          return { success: true, user: result.user };
        } else {
          // If server didn't return user data but registration was successful,
          // we'll need to do a separate login
          return { success: true };
        }
      } else {
        setError(result.message || 'Registration failed');
        return { success: false, message: result.message || 'Registration failed' };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed');
      return { success: false, message: 'Registration failed' };
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
        return { success: true };
      } else {
        const message = result.message || 'Login failed';
        setError(message);
        return {
          success: false,
          message,
          errorCode: result.errorCode        };
      }
    } catch (err) {
      // Extract error information from the response
      const errorResponse = err?.response?.data;
      // Handle different error types
      if (errorResponse) {
        const { message, errorCode } = errorResponse;
        // Set user-friendly error message based on error code
        let userMessage = message || 'Login failed';
        // Create more user-friendly messages
        switch(errorCode) {
          case 'USER_NOT_FOUND':
            userMessage = 'User not found. Please check your username.';
            break;
          case 'INVALID_PASSWORD':
            userMessage = 'Incorrect password. Please try again.';
            break;
          case 'ALREADY_LOGGED_IN':
            userMessage = 'This account is already logged in on another device.';
            break;
          case 'USER_BLOCKED':
            userMessage = 'Your account has been blocked. Please contact support.';
            break;
        }

        setError(userMessage);
        return {
          success: false,
          message: userMessage,
          errorCode      };
      }

      // Fallback for network or other errors
      setError('Unable to connect to the server. Please try again later.');
      return {
        success: false,
        message: 'Unable to connect to the server. Please try again later.',
        errorCode: 'NETWORK_ERROR'      };
    } finally {
      setLoading(false);
    }
  };



  const logout = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        await authApi.logout(user.id); // ← notify backend to set IsActive = 0
      }
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('Logged out (server + local)');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };
  
const changeGroup = async (newGroup) => {
  try {
    const response = await groupUsersApi.changeUserGroup(user.id, newGroup);
    if (response.success) {
      const updatedUser = { ...user, group: newGroup };
      setUser(updatedUser); // עדכון המשתמש בקונטקסט
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Group changed successfully to:', newGroup);
    } else {
      console.error('Failed to change group:', response.message);
    }
  // eslint-disable-next-line no-catch-shadow, no-shadow
  } catch (error) {
    console.error('Error changing group:', error);
  }
};


  return (
    <AuthContext.Provider
      value={{user, loading, error, login, register, logout, changeGroup}}>
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
