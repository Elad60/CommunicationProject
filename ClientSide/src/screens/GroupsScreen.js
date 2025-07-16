/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';
import {groupUsersApi, privateCallApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';
import {useVoice} from '../context/VoiceContext';
// import useIncomingCallListener from '../hooks/useIncomingCallListener'; // MOVED TO GLOBAL

const GroupsScreen = ({navigation}) => {
  const {activeVoiceChannel} = useVoice();
  console.log('🟢 GroupsScreen RENDERED');

  // Destructuring user and changeGroup from AuthContext
  const {user, changeGroup} = useAuth();

  // States for managing group users, loading status, and errors
  const [groupUsers, setGroupUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  // Array for group letter options
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Fetching dark mode setting from SettingsContext
  const {darkMode} = useSettings();

  // Setting text color based on dark mode
  const textColor = darkMode ? '#fff' : '#000';

  // Debounced dimensions for responsive UI
  const {height, width} = useDebouncedDimensions(300);

  // Component lifecycle logging
  useEffect(() => {
    console.log('🎬 GroupsScreen MOUNTED');
    return () => {
      console.log('🏁 GroupsScreen UNMOUNTED');
    };
  }, []);

  // Navigation listener to detect focus/blur
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔵 GroupsScreen FOCUSED');
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('🔴 GroupsScreen BLURRED');
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Incoming call listening is now handled globally by GlobalCallListener

  // Function to fetch users for the current group
  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) {
        throw new Error('Group not found');
      }

      // API call to get users by group
      const users = await groupUsersApi.getUsersByGroup(groupName);
      const filtered = users.filter(u => u.id !== user.id); // Excluding the current user
      setGroupUsers(filtered);
      setError(null);
    } catch (err) {
      console.error('Error fetching group users:', err);
      setError('Failed to load contacts.'); // Error handling
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Effect hook to fetch users when the group changes
  useEffect(() => {
    if (user?.group) {
      fetchGroupUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.group]);

  // Handler to change the group
  const handleGroupChange = newGroup => {
    changeGroup(newGroup);
  };

  // Function to get simple background color for user cards
  const getBackgroundColor = () => {
    return darkMode ? '#2a2a2a' : '#ffffff'; // Clean white/dark background
  };

  // Function to handle user press for private call options
  const onUserPress = userId => {
    const selectedUser = groupUsers.find(u => u.id === userId);

    // Show confirmation dialog before starting private call
    Alert.alert(
      'Start Private Call',
      `Are you sure you want to call ${selectedUser.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Call cancelled by user'),
        },
        {
          text: 'Call',
          style: 'default',
          onPress: () => startPrivateCall(selectedUser),
        },
      ],
    );
  };

  // Function to start private call (send invitation)
  const startPrivateCall = async otherUser => {
    if (activeVoiceChannel) {
      Alert.alert(
        'Cannot Start Call',
        'You cannot start a private call while connected to a radio channel. Please disconnect from the channel first.',
        [{text: 'OK'}],
      );
      return;
    }
    console.log(`📞 Starting private call with ${otherUser.username}`);
    try {
      // Send invitation using the API first
      const response = await privateCallApi.sendInvitation(
        user.id,
        otherUser.id,
      );
      console.log('📋 Full API response:', response);
      if (response.success) {
        // ← Fixed: lowercase 'success'
        console.log('✅ Invitation sent successfully:', response);
        // Navigate to waiting screen with invitation details
        navigation.navigate('WaitingForCall', {
          otherUser,
          invitationId: response.invitationId, // ← Fixed: lowercase 'invitationId'
          channelName: response.channelName, // ← Fixed: lowercase 'channelName'
        });
      } else {
        console.log('❌ Invitation failed:', response.message);
        Alert.alert(
          'Call Failed',
          response.message ||
            'Failed to send call invitation. Please try again.',
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('❌ Error sending call invitation:', error);
      Alert.alert(
        'Call Failed',
        error.message || 'Failed to send call invitation. Please try again.',
        [{text: 'OK'}],
      );
    }
  };

  // Function to show instructions in an alert
  const showInstructions = () => {
    Alert.alert(
      '💡 How to make Private Calls',
      '• Tap on any user to start a private call\n\n' +
        '📞 Your invitation will be sent immediately\n\n' +
        '• 🟢 Online users are more likely to respond\n' +
        '• 🔴 Offline users may not see your call\n\n' +
        '• You can cancel the call while waiting\n' +
        '• The other user has 1 minute to respond',
      [{text: 'Got it!', style: 'default'}],
    );
  };

  // Loading state display
  if (loading) {
    return (
      <AppLayout
        navigation={navigation}
        title={`Department: ${user?.group}`}
        onShowInstructions={showInstructions}>
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

  // Calculate responsive card dimensions
  const cardWidth = Math.min(width * 0.42, 180); // Max 180px width, responsive
  const cardHeight = Math.min(height * 0.16, 120); // Max 120px height, responsive

  // Main screen layout
  return (
    <AppLayout
      navigation={navigation}
      title={`Department: ${user?.group}`}
      onShowInstructions={showInstructions}>
      <ScrollView
        style={[
          styles.scrollView,
          {backgroundColor: darkMode ? '#000' : '#d9d9d9'},
        ]}>
        <View style={styles.mainGrid}>
          {groupUsers.length > 0 ? (
            groupUsers.map(u => {
              const bgColor = getBackgroundColor();

              return (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userCard,
                    {
                      backgroundColor: bgColor,
                      borderColor: darkMode ? '#555' : '#ddd',
                      width: cardWidth,
                      height: cardHeight,
                      shadowColor: darkMode ? '#000' : '#333',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: u.isActive ? 0.1 : 0.05,
                      shadowRadius: 4,
                      elevation: u.isActive ? 3 : 1,
                      opacity: u.isActive ? 1 : 0.6, // Disabled appearance for offline users
                    },
                  ]}
                  onPress={u.isActive ? () => onUserPress(u.id) : null}
                  disabled={!u.isActive}
                  activeOpacity={u.isActive ? 0.7 : 1}>
                  {/* User Avatar Circle */}
                  <View
                    style={[
                      styles.userAvatar,
                      {backgroundColor: u.isActive ? '#4CAF50' : '#f44336'},
                    ]}>
                    <Text style={styles.avatarText}>
                      {u.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <Text
                      style={[styles.username, {color: textColor}]}
                      numberOfLines={1}>
                      {u.username}
                    </Text>
                    <Text
                      style={[
                        styles.email,
                        {color: darkMode ? '#ccc' : '#666'},
                      ]}
                      numberOfLines={1}>
                      {u.email}
                    </Text>
                    <Text
                      style={[
                        styles.role,
                        {color: darkMode ? '#91aad4' : '#004080'},
                      ]}
                      numberOfLines={1}>
                      {u.role}
                    </Text>
                    {!u.isActive && (
                      <Text
                        style={[styles.offlineText, {color: '#f44336'}]}
                        numberOfLines={1}>
                        Unavailable for calls
                      </Text>
                    )}
                  </View>

                  {/* Status Indicator */}
                  <View
                    style={[
                      styles.statusIndicator,
                      {backgroundColor: u.isActive ? '#4CAF50' : '#f44336'},
                    ]}>
                    <Text style={styles.statusText}>
                      {u.isActive ? '●' : '●'}
                    </Text>
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
              No other contacts in this department.
            </Text>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomSection,
          {
            backgroundColor: darkMode ? '#000' : '#d9d9d9',
            paddingBottom: Math.max(height * 0.15, 90), // Responsive padding based on screen height
          },
        ]}>
        <Text style={[styles.label, {color: textColor}]}>
          Change Your Department:
        </Text>

        <View style={styles.letterContainer}>
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
              <Text style={[styles.letterText, {color: textColor}]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </AppLayout>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  scrollView: {flex: 1},
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  userCard: {
    borderRadius: 12,
    padding: 12,
    margin: 8,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  email: {
    fontSize: 11,
    marginBottom: 2,
  },
  role: {
    fontSize: 10,
    fontWeight: '500',
  },
  offlineText: {
    fontSize: 9,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    margin: 10,
    textAlign: 'center',
  },
  letterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  letterButton: {
    padding: 12,
    margin: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  letterText: {
    fontSize: 16,
    fontWeight: '600',
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
  bottomSection: {
    paddingHorizontal: 15,
    paddingTop: 15,
    // paddingBottom is now handled dynamically in the component
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default GroupsScreen;
