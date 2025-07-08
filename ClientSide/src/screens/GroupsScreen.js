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
  
  // States for managing group users, user states, loading status, and errors
  const [groupUsers, setGroupUsers] = useState([]);
  const [userStates, setUserStates] = useState({});
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

      // Initialize user states as 'Idle'
      const initialStates = {};
      filtered.forEach(u => {
        initialStates[u.id] = 'Idle';
      });
      setUserStates(initialStates);
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

  // Function to return appropriate icon paths based on user state
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

  // Function to get background color based on user state
  const getBackgroundColor = state => {
    switch (state) {
      case 'ListenOnly':
        return darkMode ? '#1f3d1f' : '#99cc99'; // green
      case 'ListenAndTalk':
        return darkMode ? '#1e2f4d' : '#91aad4'; // blue
      case 'Idle':
      default:
        return darkMode ? '#222' : '#ddd'; // default
    }
  };

  // Function to cycle through states: Idle -> ListenOnly -> ListenAndTalk
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

  // Function to handle user press event to change their state
  const onUserPress = userId => {
    setUserStates(prev => ({
      ...prev,
      [userId]: cycleState(prev[userId] || 'Idle'), // Toggle user state
    }));
  };

  // Function to handle long press for private call options
  const onUserLongPress = userId => {
    const selectedUser = groupUsers.find(u => u.id === userId);
    
    Alert.alert(
      'User Options',
      `What would you like to do with ${selectedUser.username}?`,
      [
        {
          text: 'Change Status',
          onPress: () => onUserPress(userId),
        },
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
                      width: CardSize,
                      height: CardSize,
                    },
                  ]}
                  onPress={() => onUserPress(u.id)}
                  onLongPress={() => onUserLongPress(u.id)}>
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

      <View style={{backgroundColor: darkMode ? '#000' : '#d9d9d9'}}>
        <Text style={[styles.label, {color: textColor}]}>
          Change Your Group:
        </Text>
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            💡 <Text style={{fontWeight: 'bold'}}>How to use Private Calls:</Text>
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            • <Text style={{fontWeight: 'bold'}}>Tap</Text> a user to change their status
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            • <Text style={{fontWeight: 'bold'}}>Long press</Text> a user for call options:
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            &nbsp;&nbsp;&nbsp;&nbsp;📞 <Text style={{fontWeight: 'bold'}}>Private Call</Text> - Send invitation & wait
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            &nbsp;&nbsp;&nbsp;&nbsp;🔗 <Text style={{fontWeight: 'bold'}}>Direct Call (Test)</Text> - Jump to call immediately
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            • Use <Text style={{fontWeight: 'bold'}}>Direct Call</Text> for testing until server is ready
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
            • Use mute/speaker controls during the call
          </Text>
        </View>
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
  instructionsContainer: {
    margin: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default GroupsScreen;
