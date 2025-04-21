/* eslint-disable eol-last */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// AnnouncementsScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAnnouncements } from '../context/AnnouncementsContext';
import { announcementsApi } from '../utils/apiService';
import { useSettings } from '../context/SettingsContext';

const AnnouncementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const {
    announcements,
    loading: contextLoading,
    fetchAnnouncementsWithStatus,
    markAllAsRead,
    fetchUnreadCount,
  } = useAnnouncements();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const scrollViewRef = useRef();
  const { darkMode} = useSettings();

  useEffect(() => {
    fetchAnnouncementsWithStatus();

    return () => {
      markAllAsRead();
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    try {
      await announcementsApi.add(title, content, user.username);
      setTitle('');
      setContent('');
      setShowAddForm(false);
      await fetchAnnouncementsWithStatus();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (err) {
      console.error('Error adding announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const textColor = darkMode ? '#fff' : '#000';

  if (contextLoading || loading) {
    return (
      <AppLayout navigation={navigation} title="📋 Announcements">
        <View style={[styles.centerContainer, { backgroundColor: darkMode ? '#121212' : '#fff'}]}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={[styles.loadingText, { color: darkMode ?   '#aaa' : '#222'}]}>Loading announcements...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title="📋 Announcements">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* טופס הוספת הודעה חדשה - מוצג כשהמשתמש לוחץ על הכפתור */}
        {showAddForm && (
          <View style={[styles.formOverlay, { backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}>
            <View style={[styles.formContainer, { backgroundColor: darkMode ? '#222' : '#fff' }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>Add New Announcement</Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                style={[styles.input, styles.titleInput, {
                  backgroundColor: darkMode ? '#333' : '#eee',
                  color: textColor,
                }]}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                placeholder="Content"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                style={[styles.input, styles.textArea, {
                  backgroundColor: darkMode ? '#333' : '#eee',
                  color: textColor,
                }]}
                value={content}
                onChangeText={setContent}
                multiline
              />
              <View style={[styles.formButtonsRow]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: darkMode ? '#444' : '#ddd'}]}
                  onPress={() => setShowAddForm(false)}>
                  <Text style={{ color: textColor }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: darkMode ? '#0066cc' : '#91aad4'}]}
                  onPress={handleAddAnnouncement}>
                  <Text style={{ color: textColor }}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          ref={scrollViewRef}>
          {announcements.map((a) => (
            <View
            key={a.id}
            style={[
              styles.card,
              !a.isRead && styles.unreadCard,
              {
                backgroundColor: !a.isRead
                  ? (darkMode ? '#262636' : '#e0f7ff')
                  : (darkMode ? '#121212' : '#fff'),
                borderColor: darkMode ? '#555' : '#ccc',
              },
            ]}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: textColor }]}>{a.title}</Text>
                {!a.isRead && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.content, { color: darkMode ? '#ccc' : '#aaa' }]}>{a.content}</Text>
              <View style={[styles.metaRow, { borderTopColor: textColor}]}>
                <Text style={[styles.metaUser, { color: darkMode ? '#00ccff' : '#91aad4' }]}>{a.userName}</Text>
                <Text style={[styles.metaTime, { color: darkMode ? '#999' : '#aaa' }]}>{formatDate(a.createdAt)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        {(user?.role === 'Technician' || user?.role === 'Admin') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 10,
    width: '100%',
    paddingBottom: 70,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    width: '100%',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00ccff',
    shadowColor: '#00ccff',
    shadowOpacity: 0.3,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#00ccff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  newBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  metaUser: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaTime: {
    fontSize: 12,
  },
    addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#0066cc',
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 34,
  },
    formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  titleInput: {
    height: 50,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
    centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 10,
  },
});

export default AnnouncementsScreen;