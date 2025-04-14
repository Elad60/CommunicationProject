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
        return { success: true };
      } else {
        const message = result.message || 'Login failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      console.error('Login error:', err);
  
      // 🧠 שליפת הודעת שגיאה מהשרת אם קיימת
      const serverMessage = err?.response?.data?.message;
  
      if (serverMessage?.includes('already logged in')) {
        setError('This user is already logged in on another device.');
        return { success: false, message: serverMessage };
      }
  
      if (serverMessage?.includes('Invalid username') || serverMessage?.includes('password')) {
        setError(serverMessage);
        return { success: false, message: serverMessage };
      }
  
      setError('Login failed');
      return { success: false, message: 'Login failed' };
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
