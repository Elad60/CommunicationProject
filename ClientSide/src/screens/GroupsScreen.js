// src/screens/GroupsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { groupUsersApi } from '../utils/apiService';

const GroupsScreen = ({ navigation }) => {
  const { user, changeGroup } = useAuth();
  const [groupUsers, setGroupUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // שליפת משתמשים מהקבוצה
  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) throw new Error('Group not found');

      const users = await groupUsersApi.getUsersByGroup(groupName);
      setGroupUsers(users);
      setError(null);
    } catch (err) {
      console.error('Error fetching group users:', err);
      setError('Failed to load group users.');
    } finally {
      setLoading(false);
    }
  };

  // מאזין לשינוי בקבוצה
  useEffect(() => {
    if (user?.group) {
      fetchGroupUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.group]);

  // שינוי קבוצה
  const handleGroupChange = (newGroup) => {
    changeGroup(newGroup);
  };

  if (loading) {
    return (
      <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {groupUsers.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userCard}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.role}>Role: {user.role}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Change Your Group:</Text>
        <View style={styles.letterContainer}>
          {letters.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[
                styles.letterButton,
                user?.group === letter && styles.letterButtonSelected,
              ]}
              onPress={() => handleGroupChange(letter)}
            >
              <Text style={styles.letterText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 5 },
  userCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    margin: 5,
  },
  username: { fontSize: 18, color: '#fff' },
  email: { fontSize: 14, color: '#aaa' },
  role: { fontSize: 14, color: '#00ccff' },
  label: { fontSize: 18, color: '#fff', margin: 10, textAlign: 'center' },
  letterContainer: { flexDirection: 'row', justifyContent: 'center' },
  letterButton: {
    backgroundColor: '#333',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  letterButtonSelected: {
    backgroundColor: '#0066cc',
  },
  letterText: { color: '#fff', fontSize: 18 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff' },
});

export default GroupsScreen;
