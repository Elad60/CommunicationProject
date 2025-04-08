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
  const { user } = useAuth();
  const [groupUsers, setGroupUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // שליפת משתמשים מהקבוצה
  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) throw new Error('Group not found');

      const users = await groupUsersApi.getUsersByGroup(groupName);
      // הוספת מצב התחלתי לכל משתמש
      const usersWithState = users.map((u) => ({ ...u, state: 'Idle' }));
      setGroupUsers(usersWithState);
      setError(null);
    } catch (err) {
      console.error('Error fetching group users:', err);
      setError('Failed to load group users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupUsers();
  }, [user?.group]);

  // שינוי מצב המשתמש
  const toggleUserState = (userId) => {
    setGroupUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, state: getNextState(u.state) } : u
      )
    );
  };

  // קביעת המצב הבא
  const getNextState = (state) => {
    switch (state) {
      case 'Idle':
        return 'ListenOnly';
      case 'ListenOnly':
        return 'ListenAndTalk';
      case 'ListenAndTalk':
        return 'Idle';
      default:
        return 'Idle';
    }
  };

  // קבלת סגנון דינמי לפי מצב
  const getUserCardStyle = (state) => {
    switch (state) {
      case 'Idle':
        return { backgroundColor: '#1E1E1E', borderLeftColor: '#555' };
      case 'ListenOnly':
        return { backgroundColor: '#2E2E2E', borderLeftColor: '#00ccff' };
      case 'ListenAndTalk':
        return { backgroundColor: '#3E3E3E', borderLeftColor: '#00ff66' };
      default:
        return { backgroundColor: '#1E1E1E', borderLeftColor: '#555' };
    }
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

  if (error) {
    return (
      <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroupUsers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {groupUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, getUserCardStyle(user.state)]}
              onPress={() => toggleUserState(user.id)}
            >
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.role}>Role: {user.role}</Text>
              <Text style={styles.state}>State: {user.state}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    justifyContent: 'flex-start',
  },
  userCard: {
    borderRadius: 8,
    padding: 15,
    margin: 5,
    borderLeftWidth: 6,
    minWidth: '45%',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#aaa',
  },
  role: {
    fontSize: 14,
    color: '#00ccff',
  },
  state: {
    fontSize: 14,
    color: '#ffcc00',
    marginTop: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default GroupsScreen;
