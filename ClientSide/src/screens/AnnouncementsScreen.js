// src/screens/AnnouncementsScreen.js
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
import { announcementsApi } from '../utils/apiService';

const AnnouncementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsApi.getAll();
      setAnnouncements(data.reverse());
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await announcementsApi.add(title, content, user.username);
      setTitle('');
      setContent('');
      fetchAnnouncements();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (err) {
      console.error('Error adding announcement:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout navigation={navigation} title="📋 Announcements">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title="📋 Announcements">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          ref={scrollViewRef}>
          {announcements.map((a) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.content}>{a.content}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaUser}>{a.userName}</Text>
                <Text style={styles.metaTime}>{new Date(a.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {(user?.role === 'Technician' || user?.role === 'Admin') && (
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Title"
              placeholderTextColor="#aaa"
              style={[styles.input, styles.titleInput]}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              placeholder="Content"
              placeholderTextColor="#aaa"
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              multiline
            />
            <TouchableOpacity style={styles.button} onPress={handleAddAnnouncement}>
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 10,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  content: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaUser: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: '600',
  },
  metaTime: {
    color: '#999',
    fontSize: 12,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  titleInput: {
    height: 40,
  },
  textArea: {
    height: 100,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
  },
});

export default AnnouncementsScreen;
