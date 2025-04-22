/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
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
import {useAuth} from '../context/AuthContext';
import {groupUsersApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';

const GroupsScreen = ({navigation}) => {
  const {user, changeGroup} = useAuth();
  const [groupUsers, setGroupUsers] = useState([]);
  const [userStates, setUserStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const {darkMode} = useSettings();
  const textColor = darkMode ? '#fff' : '#000';

  // Fetch users in the same group as current user
  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) throw new Error('Group not found');

      const users = await groupUsersApi.getUsersByGroup(groupName);
      const filtered = users.filter(u => u.id !== user.id);
      setGroupUsers(filtered);

      // Initialize per-user channel state (Idle by default)
      const initialStates = {};
      filtered.forEach(u => {
        initialStates[u.id] = 'Idle';
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
  }, [user?.group]);

  // Allow user to switch group (A–F)
  const handleGroupChange = newGroup => {
    changeGroup(newGroup);
  };

  // Return icon paths for each channel state
  const getIconPaths = channelState => {
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

  // Return background color based on channel state
  const getBackgroundColor = state => {
    switch (state) {
      case 'ListenOnly':
        return darkMode ? '#1f3d1f' : '#99cc99';
      case 'ListenAndTalk':
        return darkMode ? '#1e2f4d' : '#91aad4';
      case 'Idle':
      default:
        return darkMode ? '#222' : '#ddd';
    }
  };

  // Toggle between Idle → ListenOnly → ListenAndTalk → Idle
  const cycleState = state => {
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

  const onUserPress = userId => {
    setUserStates(prev => ({
      ...prev,
      [userId]: cycleState(prev[userId] || 'Idle'),
    }));
  };

  if (loading) {
    return (
      <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
        <View
          style={[
            styles.centerContainer,
            {backgroundColor: darkMode ? '#000' : '#d9d9d9'},
          ]}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={[styles.loadingText, {color: textColor}]}>
            Loading users...
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title={`Group: ${user?.group}`}>
      <ScrollView
        style={[
          styles.scrollView,
          {backgroundColor: darkMode ? '#000' : '#d9d9d9'},
        ]}>
        <View style={styles.mainGrid}>
          {groupUsers.length > 0 ? (
            groupUsers.map(u => {
              const channelState = userStates[u.id] || 'Idle';
              const icons = getIconPaths(channelState);
              const bgColor = getBackgroundColor(channelState);

              return (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userCard,
                    {
                      backgroundColor: bgColor,
                      borderColor: darkMode ? '#888' : '#333',
                    },
                  ]}
                  onPress={() => onUserPress(u.id)}>
                  <Text style={{color: textColor, fontWeight: 'bold'}}>
                    {u.username}
                  </Text>
                  <Text style={{color: darkMode ? '#ccc' : '#333'}}>
                    {u.email}
                  </Text>
                  <Text style={{color: darkMode ? '#91aad4' : '#004080'}}>
                    Role: {u.role}
                  </Text>

                  <View style={styles.iconRow}>
                    <Image source={icons.headphones} style={styles.icon} />
                    <View
                      style={[
                        styles.statusDot,
                        {backgroundColor: u.isActive ? '#00cc00' : '#555'},
                      ]}
                    />
                    <Image source={icons.mic} style={styles.icon} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text
              style={{
                color: darkMode ? '#aaa' : '#444',
                textAlign: 'center',
                marginTop: 20,
              }}>
              No other users in this group.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Section to change group manually */}
      <View style={{backgroundColor: darkMode ? '#000' : '#d9d9d9'}}>
        <Text style={[styles.label, {color: textColor}]}>
          Change Your Group:
        </Text>
      </View>
      <View
        style={[
          styles.letterContainer,
          {backgroundColor: darkMode ? '#000' : '#d9d9d9'},
        ]}>
        {letters.map(letter => (
          <TouchableOpacity
            key={letter}
            style={[
              styles.letterButton,
              {
                backgroundColor:
                  user?.group === letter
                    ? darkMode
                      ? '#0066cc'
                      : '#91aad4'
                    : darkMode
                    ? '#333'
                    : '#eee',
              },
            ]}
            onPress={() => handleGroupChange(letter)}>
            <Text style={{color: textColor}}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {flex: 1},
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
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  email: {
    fontSize: 12,
    textAlign: 'center',
  },
  role: {
    fontSize: 12,
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
    margin: 10,
    textAlign: 'center',
  },
  letterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  letterButton: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  letterText: {
    fontSize: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUsersText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    width: '100%',
  },
});

export default GroupsScreen;
