/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';
import {groupUsersApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';
import { useDebouncedDimensions } from '../utils/useDebouncedDimensions';

const GroupsScreen = ({navigation}) => {
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
  const { height, width } = useDebouncedDimensions(300);

  // Function to fetch users for the current group
  const fetchGroupUsers = async () => {
    try {
      setLoading(true);
      const groupName = user?.group;
      if (!groupName) {throw new Error('Group not found');}

      // API call to get users by group
      const users = await groupUsersApi.getUsersByGroup(groupName);
      const filtered = users.filter(u => u.id !== user.id); // Excluding the current user
      setGroupUsers(filtered);
      setError(null);
    } catch (err) {
      console.error('Error fetching group users:', err);
      setError('Failed to load group users.'); // Error handling
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
    return darkMode ? '#333' : '#f5f5f5'; // Simple consistent color
  };

  // Function to handle user press for private call options
  const onUserPress = userId => {
    const selectedUser = groupUsers.find(u => u.id === userId);
    
    Alert.alert(
      'Call Options',
      `What would you like to do with ${selectedUser.username}?`,
      [
        {
          text: 'Private Call',
          onPress: () => startPrivateCall(selectedUser),
        },
        {
          text: 'Direct Call (Test)',
          onPress: () => startDirectCall(selectedUser),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Function to start private call (send invitation)
  const startPrivateCall = (otherUser) => {
    console.log(`📞 Sending call invitation to ${otherUser.username}`);
    navigation.navigate('WaitingForCall', {otherUser});
  };

  // Function for direct call (bypass invitation system for testing)
  const startDirectCall = (otherUser) => {
    console.log(`🔗 Starting direct call with ${otherUser.username} (test mode)`);
    Alert.alert(
      'Direct Call',
      `Starting direct call with ${otherUser.username}.\n\nThis bypasses the invitation system for testing purposes.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start Call',
          onPress: () => navigation.navigate('PrivateCall', {
            otherUser,
            isCallAccepted: true,
          }),
        },
      ]
    );
  };

  // Function to show instructions in an alert
  const showInstructions = () => {
    Alert.alert(
      '💡 How to make Private Calls',
      '• Tap on any user for call options\n\n' +
      '📞 Private Call - Send invitation & wait for response\n\n' +
      '🔗 Direct Call (Test) - Start call immediately for testing\n\n' +
      '• 🟢 Online users are available\n' +
      '• 🔴 Offline users may not respond\n\n' +
      '• Use mute/speaker controls during calls',
      [{text: 'Got it!', style: 'default'}]
    );
  };

  // Loading state display
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

  // Calculate the card size dynamically based on screen size
  const CardSize = Math.max(
    130,
    Math.sqrt((width * 0.7 * height * 0.7) / (groupUsers.length + 4))
  );

  // Main screen layout
  return (
    <AppLayout 
      navigation={navigation} 
      title={`Group: ${user?.group}`}
      onShowInstructions={showInstructions}
    >
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
                      width: CardSize,
                      height: CardSize,
                    },
                  ]}
                  onPress={() => onUserPress(u.id)}>
                  <Text style={{color: textColor, fontWeight: 'bold', fontSize: 16}}>
                    {u.username}
                  </Text>
                  <Text style={{color: darkMode ? '#ccc' : '#666', fontSize: 12}}>
                    {u.email}
                  </Text>
                  <Text style={{color: darkMode ? '#91aad4' : '#004080', fontSize: 12}}>
                    Role: {u.role}
                  </Text>

                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        {backgroundColor: u.isActive ? '#00cc00' : '#ff4444'},
                      ]}
                    />
                    <Text style={{color: darkMode ? '#ccc' : '#666', fontSize: 10}}>
                      {u.isActive ? 'Online' : 'Offline'}
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
              No other users in this group.
            </Text>
          )}
        </View>
      </ScrollView>

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

// Styles for the component
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
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
