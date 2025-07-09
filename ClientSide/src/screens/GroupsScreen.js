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
import {groupUsersApi, privateCallApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';
import { useDebouncedDimensions } from '../utils/useDebouncedDimensions';
import useIncomingCallListener from '../hooks/useIncomingCallListener';

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

  // Add incoming call listener
  const {isListening} = useIncomingCallListener(navigation);

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
    
    // Directly start private call without dialog
    startPrivateCall(selectedUser);
  };

  // Function to start private call (send invitation)
  const startPrivateCall = async (otherUser) => {
    console.log(`📞 Starting private call with ${otherUser.username}`);
    
    try {
      // Show loading state
      Alert.alert(
        'Sending Invitation',
        `Calling ${otherUser.username}...`,
        [],
        { cancelable: false }
      );
      
      // Send invitation using the API
      const response = await privateCallApi.sendInvitation(user.id, otherUser.id);
      
      if (response.Success) {
        console.log('✅ Invitation sent successfully:', response);
        
        // Navigate to waiting screen with invitation details
        navigation.navigate('WaitingForCall', {
          otherUser,
          invitationId: response.InvitationId,
          channelName: response.ChannelName,
        });
      } else {
        Alert.alert(
          'Call Failed',
          response.Message || 'Failed to send call invitation. Please try again.',
          [{text: 'OK'}]
        );
      }
    } catch (error) {
      console.error('❌ Error sending call invitation:', error);
      Alert.alert(
        'Call Failed',
        error.message || 'Failed to send call invitation. Please try again.',
        [{text: 'OK'}]
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
        
        {/* Call Listener Status */}
        <View style={styles.callListenerStatus}>
          <View style={[
            styles.listenerDot,
            {backgroundColor: isListening ? '#00cc00' : '#ff4444'}
          ]} />
          <Text style={[styles.listenerText, {color: textColor}]}>
            Call Listener: {isListening ? 'Active' : 'Inactive'}
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
  callListenerStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  listenerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  listenerText: {
    fontSize: 12,
  },
});

export default GroupsScreen;
