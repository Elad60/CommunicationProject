import React, {createContext, useState, useEffect, useContext} from 'react';
import {authApi, groupUsersApi} from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user from persistent storage on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔄 AuthContext: Loading user from storage...');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('✅ AuthContext: User loaded from storage:', parsedUser);
          setUser(parsedUser);
        } else {
          console.log('⚠️ AuthContext: No user found in storage');
        }
      } catch (err) {
        console.error('❌ AuthContext: Error loading user from storage:', err);
      } finally {
        setLoading(false);
        console.log('🔄 AuthContext: Initial loading complete');
      }
    };
    loadUser();
  }, []);

  // Track user state changes
  useEffect(() => {
    console.log('🔄 AuthContext: User state changed:', user);
    if (user) {
      console.log('👤 AuthContext: User is now logged in:', user.username, 'ID:', user.id);
    } else {
      console.log('👤 AuthContext: User is now logged out');
    }
  }, [user]);

  // Register a new user
  const register = async (username, password, email, group) => {
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register(username, password, email, group);
      console.log('Register result:', result);

      if (result.success) {
        if (result.user) {
          // Save user returned by server
          await AsyncStorage.setItem('user', JSON.stringify(result.user));
          setUser(result.user);
          return { success: true, user: result.user };
        } else {
          // Registration successful but no user data returned
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

  // Log in user
  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 AuthContext: Attempting login for:', username);
      const result = await authApi.login(username, password);

      if (result.success && result.user) {
        console.log('✅ AuthContext: Login successful for user:', result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        return { success: true };
      } else {
        const message = result.message || 'Login failed';
        console.log('❌ AuthContext: Login failed:', message);
        setError(message);
        return {
          success: false,
          message,
          errorCode: result.errorCode,
        };
      }
    } catch (err) {
      // Handle known error response from server
      const errorResponse = err?.response?.data;
      if (errorResponse) {
        const { message, errorCode } = errorResponse;
        let userMessage = message || 'Login failed';

        // Customize messages based on backend error codes
        switch (errorCode) {
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
          errorCode,
        };
      }

      // Generic fallback for network/server issues
      setError('Unable to connect to the server. Please try again later.');
      return {
        success: false,
        message: 'Unable to connect to the server. Please try again later.',
        errorCode: 'NETWORK_ERROR',
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout: remove local user and notify backend
  const logout = async () => {
    setLoading(true);
    try {
      console.log('🔄 AuthContext: Logging out user:', user?.username);
      if (user?.id) {
        await authApi.logout(user.id);
      }
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('✅ AuthContext: Logged out (server + local)');
    } catch (err) {
      console.error('❌ AuthContext: Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Change user's group (e.g., from 'B' to 'A')
  const changeGroup = async (newGroup) => {
    try {
      const response = await groupUsersApi.changeUserGroup(user.id, newGroup);
      if (response.success) {
        const updatedUser = { ...user, group: newGroup };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('Group changed successfully to:', newGroup);
      } else {
        console.error('Failed to change group:', response.message);
      }
    } catch (error) {
      console.error('Error changing group:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, changeGroup }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
