/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { announcementsApi } from '../utils/apiService';
import { useAuth } from './AuthContext';

const AnnouncementsContext = createContext();

export const AnnouncementsProvider = ({ children }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load announcements with their read/unread status
  const fetchAnnouncementsWithStatus = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await announcementsApi.getAllWithReadStatus(user.id);
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements with status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get number of unread announcements for the current user
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count } = await announcementsApi.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Mark all announcements as read and update local state
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await announcementsApi.markAllAsRead(user.id);
      setUnreadCount(0);
      setAnnouncements(current =>
        current.map(announcement => ({ ...announcement, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking announcements as read:', err);
    }
  };

  // Fetch unread count on initial load when user is available
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  return (
    <AnnouncementsContext.Provider
      value={{
        announcements,
        unreadCount,
        loading,
        fetchAnnouncementsWithStatus,
        fetchUnreadCount,
        markAllAsRead
      }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

// Custom hook for accessing the context
export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};
