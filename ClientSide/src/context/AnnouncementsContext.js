// context/AnnouncementsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { announcementsApi } from '../utils/apiService';
import { useAuth } from './AuthContext';

const AnnouncementsContext = createContext();

export const AnnouncementsProvider = ({ children }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // פונקציה לטעינת הודעות עם סטטוס קריאה
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

  // פונקציה לטעינת מספר הודעות שלא נקראו
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count } = await announcementsApi.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // פונקציה לסימון כל ההודעות כנקראות
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await announcementsApi.markAllAsRead(user.id);
      // עדכון מיידי של הממשק
      setUnreadCount(0);
      setAnnouncements(current => 
        current.map(announcement => ({ ...announcement, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking announcements as read:', err);
    }
  };

  // טעינת נתונים התחלתית
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};