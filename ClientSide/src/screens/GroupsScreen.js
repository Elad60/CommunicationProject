import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { groupUsersApi } from '../utils/apiService';

const GroupsScreen = ({ navigation }) => {
  const { user, changeGroup } = useAuth();
  const [groupUsers, setGroupUsers] = useState([]);
  const [userStates, setUserStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) throw new Error('Group not found');

      const users = await groupUsersApi.getUsersByGroup(groupName);
      const filtered = users.filter(u => u.id !== user.id);
      setGroupUsers(filtered);

      const initialStates = {};
      filtered.forEach(u => {
        initialStates[u.id] = 'Idle'; // ברירת מחדל
      });
      setUserStates(initialStates);
      setError(null);
    } catch (err) {
      console.error('Error fetching group users:', err);
      setError('Failed to load group users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.group) {
      fetchGroupUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.group]);

  const handleGroupChange = (newGroup) => {
    changeGroup(newGroup);
  };

  const getIconPaths = (channelState) => {
    switch (channelState) {
      case 'Idle':
        return {
          headphones: require('../../assets/logos/crossed-HF.png'),
          mic: require('../../assets/logos/crossed-mic.png'),
        };
      case 'ListenOnly':
        return {
          headphones: require('../../assets/logos/headphones.png'),
          mic: require('../../assets/logos/crossed-mic.png'),
        };
      case 'ListenAndTalk':
        return {
          headphones: require('../../assets/logos/headphones.png'),
          mic: require('../../assets/logos/microphone.png'),
        };
      default:
        return {
          headphones: require('../../assets/logos/crossed-HF.png'),
          mic: require('../../assets/logos/microphone.png'),
        };
    }
  };

  const getBackgroundColor = (state) => {
    switch (state) {
      case 'ListenOnly':
        return '#1f3d1f'; // ירוק כהה
      case 'ListenAndTalk':
        return '#1e2f4d'; // כחול כהה
      case 'Idle':
      default:
        return '#222'; // אפור כהה
    }
  };

  const cycleState = (state) => {
    switch (state) {
      case 'Idle':
        return 'ListenOnly';
      case 'ListenOnly':
        return 'ListenAndTalk';
      case 'ListenAndTalk':
      default:
        return 'Idle';
    }
  };

  const onUserPress = (userId) => {
    setUserStates((prev) => ({
      ...prev,
      [userId]: cycleState(prev[userId] || 'Idle'),
    }));
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
          {groupUsers.length > 0 ? (
            groupUsers.map((u) => {
              const channelState = userStates[u.id] || 'Idle';
              const icons = getIconPaths(channelState);
              const bgColor = getBackgroundColor(channelState);

              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userCard, { backgroundColor: bgColor }]}
                  onPress={() => onUserPress(u.id)}
                >
                  <Text style={styles.username}>{u.username}</Text>
                  <Text style={styles.email}>{u.email}</Text>
                  <Text style={styles.role}>Role: {u.role}</Text>

                  <View style={styles.iconRow}>
                    <Image source={icons.headphones} style={styles.icon} />
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: u.isActive ? '#00cc00' : '#555' },
                      ]}
                    />
                    <Image source={icons.mic} style={styles.icon} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noUsersText}>No other users in this group.</Text>
          )}
        </View>
      </ScrollView>

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
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  userCard: {
    borderRadius: 8,
    padding: 10,
    margin: 8,
    width: 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  username: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  email: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  role: {
    fontSize: 12,
    color: '#91aad4',
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 18,
    color: '#fff',
    margin: 10,
    textAlign: 'center',
  },
  letterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  letterButton: {
    backgroundColor: '#333',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  letterButtonSelected: {
    backgroundColor: '#0066cc',
  },
  letterText: {
    color: '#fff',
    fontSize: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
  },
  noUsersText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    width: '100%',
  },
});

export default GroupsScreen;
