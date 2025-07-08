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
  const {otherUser} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();

  const [invitationId, setInvitationId] = useState(null);
  const [waitingTime, setWaitingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [status, setStatus] = useState('Calling...');

  // Timer for waiting time
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime(prev => prev + 1);
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

  // Send call invitation when screen mounts
  useEffect(() => {
    sendCallInvitation();
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancelCall();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Send call invitation
  const sendCallInvitation = async () => {
    try {
      console.log(`📞 Sending call invitation to ${otherUser.username}`);
      console.log(`📊 User ID: ${user.id}, Other User ID: ${otherUser.id}`);
      
      // For now, simulate the invitation flow since backend endpoints may not exist yet
      const simulatedInvitationId = `call_${user.id}_${otherUser.id}_${Date.now()}`;
      console.log(`🔧 Simulated invitation ID: ${simulatedInvitationId}`);
      
      setInvitationId(simulatedInvitationId);
      
      // Try to send real invitation, but fallback to simulation if it fails
      try {
        const result = await privateCallApi.sendCallInvitation(user.id, otherUser.id);
        console.log('✅ Real API call succeeded:', result);
        setInvitationId(result.invitationId);
        startPollingForResponse(result.invitationId);
      } catch (apiError) {
        console.log('⚠️ Real API not available, using simulation mode');
        console.error('API Error details:', apiError.message);
        
        // Show user that we're in demo mode
        Alert.alert(
          'Demo Mode',
          `Call invitation sent to ${otherUser.username}!\n\nNote: This is demo mode since the server endpoints are not ready yet.\n\nFor testing: The other user should manually start a call with you.`,
          [{text: 'OK'}]
        );
        
        // Start simulation polling
        startSimulationPolling(simulatedInvitationId);
      }
    } catch (error) {
      console.error('Critical error in sendCallInvitation:', error);
      Alert.alert(
        'Call Failed',
        `Failed to initiate call. Error: ${error.message}`,
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
    }
  };

  // Simulation polling for demo purposes
  const startSimulationPolling = (invitationId) => {
    console.log('🎭 Starting simulation polling...');
    let pollCount = 0;
    
    const pollInterval = setInterval(() => {
      pollCount++;
      console.log(`🔄 Simulation poll ${pollCount}...`);
      
      // After 10 seconds, simulate timeout
      if (pollCount >= 5) {
        clearInterval(pollInterval);
        console.log('⏰ Simulation timeout');
        setStatus('Demo: No Answer');
        
        Alert.alert(
          'Demo Timeout',
          `This is a demo. In real usage, ${otherUser.username} would have 30 seconds to respond.\n\nTo test the actual call, both users should manually navigate to a private call.`,
          [{text: 'OK', onPress: () => navigation.goBack()}]
        );
      }
    }, 2000);

    // Cleanup interval when component unmounts
    return () => clearInterval(pollInterval);
  };

  // Poll for call response
  const startPollingForResponse = (invitationId) => {
    console.log('🔄 Starting real API polling...');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await privateCallApi.checkOutgoingCallStatus(invitationId, user.id);
        console.log('📊 Polling response:', response);
        
        if (response.status === 'accepted') {
          clearInterval(pollInterval);
          console.log('✅ Call accepted! Starting private call...');
          
          // Navigate to private call screen
          navigation.replace('PrivateCall', {
            otherUser,
            invitationId,
            isCallAccepted: true,
          });
        } else if (response.status === 'rejected') {
          clearInterval(pollInterval);
          console.log('❌ Call rejected');
          setStatus('Call Rejected');
          
          Alert.alert(
            'Call Rejected',
            `${otherUser.username} declined your call.`,
            [{text: 'OK', onPress: () => navigation.goBack()}]
          );
        } else if (response.status === 'timeout') {
          clearInterval(pollInterval);
          console.log('⏰ Call timed out');
          setStatus('No Answer');
          
          Alert.alert(
            'No Answer',
            `${otherUser.username} didn't answer your call.`,
            [{text: 'OK', onPress: () => navigation.goBack()}]
          );
        }
      } catch (error) {
        console.error('Error polling for call response:', error);
        console.error('Full error object:', error);
        clearInterval(pollInterval);
        setStatus('Connection Error');
        
        Alert.alert(
          'Connection Error',
          `Lost connection while waiting for response.\nError: ${error.message}`,
          [{text: 'OK', onPress: () => navigation.goBack()}]
        );
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval when component unmounts
    return () => clearInterval(pollInterval);
  };

  // Cancel call
  const handleCancelCall = async () => {
    try {
      if (invitationId) {
        await privateCallApi.cancelCallInvitation(invitationId, user.id);
        console.log('📞 Call invitation canceled');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error canceling call:', error);
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
        <Text style={[styles.waitingTime, {color: textColor}]}>
          {formatWaitingTime(waitingTime)}
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
          How it works:
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          📧 {otherUser.username} will receive a call invitation
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          ⏰ They have 30 seconds to respond
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          ✅ If accepted, you'll both join the private call
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          ❌ If declined, you'll be notified
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔄 You can cancel the call at any time
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