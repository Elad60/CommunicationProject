import React, {createContext, useState, useEffect, useContext} from 'react';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from '../utils/authStorage';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Register function
  const register = async (username, password, email) => {
    setLoading(true);
    setError('');

    try {
      const result = await registerUser(username, password, email);

      if (result.success) {
        setUser(result.user);
        return {success: true};
      } else {
        setError(result.message);
        return {success: false, message: result.message};
      }
    } catch (err) {
      setError('Registration failed');
      return {success: false, message: 'Registration failed'};
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setError('');

    try {
      const result = await loginUser(username, password);

      if (result.success) {
        setUser(result.user);
        return {success: true};
      } else {
        setError(result.message);
        return {success: false, message: result.message};
      }
    } catch (err) {
      setError('Login failed');
      return {success: false, message: 'Login failed'};
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
