import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Alert,
  Animated,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';

const WaitingForCallScreen = ({route, navigation}) => {
  const {otherUser, invitationId, channelName} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();

  const [waitingTime, setWaitingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [status, setStatus] = useState('Sending invitation...');
  const [isPolling, setIsPolling] = useState(false);

  // Timer for waiting time (max 60 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime(prev => {
        if (prev >= 59) {
          // 60 seconds timeout
          handleTimeout();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation for the calling indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  // Start polling for response when screen mounts
  useEffect(() => {
    if (invitationId) {
      console.log(`📞 Starting to wait for response from ${otherUser.username}`);
      console.log(`📊 Invitation ID: ${invitationId}`);
      console.log(`📡 Channel Name: ${channelName}`);
      
      setStatus('Waiting for response...');
      startPollingForResponse();
    }
  }, [invitationId]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancelCall();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Handle timeout (60 seconds)
  const handleTimeout = async () => {
    console.log('⏰ Call invitation timed out after 60 seconds');
    setIsPolling(false);
    setStatus('No Answer');
    
    try {
      // Cancel the invitation on the server
      await privateCallApi.cancelInvitation(invitationId, user.id);
      console.log('✅ Invitation cancelled due to timeout');
    } catch (error) {
      console.error('❌ Error cancelling invitation on timeout:', error);
    }
    
    Alert.alert(
      'No Answer',
      `${otherUser.username} didn't respond to your call within 60 seconds.`,
      [{text: 'OK', onPress: () => navigation.goBack()}]
    );
  };

  // Poll for call response
  const startPollingForResponse = () => {
    console.log('🔄 Starting polling for call response...');
    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      if (!isPolling) {
        clearInterval(pollInterval);
        return;
      }
      
      try {
        console.log('🔄 Polling for call status...');
        const response = await privateCallApi.getCallStatus(invitationId, user.id);
        console.log('📊 Polling response:', response);
        
        if (response.Success) {
          const currentStatus = response.Status;
          
          if (currentStatus === 'accepted') {
            clearInterval(pollInterval);
            setIsPolling(false);
            console.log('✅ Call accepted! Navigating to private call...');
            
            // Navigate to private call screen
            navigation.replace('PrivateCall', {
              otherUser,
              invitationId,
              channelName: response.ChannelName || channelName,
              isCallAccepted: true,
              isCaller: true, // This user is the caller
              currentUserId: user.id, // Add current user ID for server monitoring
            });
            
          } else if (currentStatus === 'rejected') {
            clearInterval(pollInterval);
            setIsPolling(false);
            console.log('❌ Call rejected');
            setStatus('Call Rejected');
            
            Alert.alert(
              'Call Rejected',
              `${otherUser.username} declined your call.`,
              [{text: 'OK', onPress: () => navigation.goBack()}]
            );
            
          } else if (currentStatus === 'cancelled') {
            clearInterval(pollInterval);
            setIsPolling(false);
            console.log('🚫 Call was cancelled');
            setStatus('Call Cancelled');
            navigation.goBack();
            
          } else if (currentStatus === 'expired') {
            clearInterval(pollInterval);
            setIsPolling(false);
            console.log('⏰ Call expired on server');
            setStatus('Call Expired');
            
            Alert.alert(
              'Call Expired',
              `The call invitation has expired.`,
              [{text: 'OK', onPress: () => navigation.goBack()}]
            );
          } else {
            // Still pending - continue polling
            console.log(`🕐 Call still pending: ${currentStatus}`);
            setStatus('Waiting for response...');
          }
        } else {
          console.error('❌ Failed to get call status:', response);
        }
        
      } catch (error) {
        console.error('❌ Error polling for call response:', error);
        // Don't stop polling on single error - might be temporary network issue
        console.log('🔄 Continuing to poll despite error...');
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => {
      console.log('🛑 Stopping polling for call response');
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  };

  // Cancel call
  const handleCancelCall = async () => {
    console.log('🚫 User requested to cancel call');
    
    try {
      setIsPolling(false);
      setStatus('Cancelling...');
      
      if (invitationId) {
        const response = await privateCallApi.cancelInvitation(invitationId, user.id);
        if (response.Success) {
          console.log('✅ Call invitation cancelled successfully');
        } else {
          console.log('⚠️ Cancel response was not successful:', response.Message);
        }
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error canceling call:', error);
      // Even if cancellation fails, go back - user wants to leave
      navigation.goBack();
    }
  };

  // Format waiting time
  const formatWaitingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';
  const textColor = darkMode ? '#fff' : '#000';
  const cardColor = darkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>Calling...</Text>
        <Text style={[styles.waitingTime, {color: waitingTime >= 50 ? '#ff4444' : textColor}]}>
          {formatWaitingTime(waitingTime)} / 1:00
        </Text>
      </View>

      {/* User Info */}
      <View style={[styles.userInfo, {backgroundColor: cardColor}]}>
        <Animated.View 
          style={[
            styles.userAvatar,
            {
              transform: [{scale: pulseAnim}],
            },
          ]}
        >
          <Text style={[styles.avatarText, {color: '#fff'}]}>
            {otherUser.username.charAt(0).toUpperCase()}
          </Text>
        </Animated.View>
        
        <Text style={[styles.username, {color: textColor}]}>
          {otherUser.username}
        </Text>
        <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666'}]}>
          {otherUser.email}
        </Text>
        <Text style={[styles.status, {color: darkMode ? '#91aad4' : '#004080'}]}>
          {status}
        </Text>
      </View>

      {/* Calling Animation */}
      <View style={styles.callingContainer}>
        <View style={styles.callingRings}>
          <Animated.View style={[styles.ring, styles.ring1, {transform: [{scale: pulseAnim}]}]} />
          <Animated.View style={[styles.ring, styles.ring2, {transform: [{scale: pulseAnim}]}]} />
          <Animated.View style={[styles.ring, styles.ring3, {transform: [{scale: pulseAnim}]}]} />
        </View>
        <Text style={[styles.callingText, {color: textColor}]}>
          📞 Waiting for {otherUser.username} to answer...
        </Text>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        style={[styles.cancelButton, {backgroundColor: '#ff4444'}]}
        onPress={handleCancelCall}
      >
        <Text style={styles.cancelButtonText}>Cancel Call</Text>
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsTitle, {color: textColor}]}>
          Call Status:
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          📧 Invitation sent to {otherUser.username}
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          ⏰ They have 60 seconds to respond
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          📱 Channel: {channelName}
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔄 Checking for response every 2 seconds
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🚫 You can cancel the call at any time
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waitingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  userInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  callingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  callingRings: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.3,
  },
  ring1: {
    width: 80,
    height: 80,
  },
  ring2: {
    width: 110,
    height: 110,
  },
  ring3: {
    width: 140,
    height: 140,
  },
  callingText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 'auto',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default WaitingForCallScreen; 