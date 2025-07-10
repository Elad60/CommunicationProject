import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';
import useIncomingCallListener from '../hooks/useIncomingCallListener';

const IncomingCallScreen = ({route, navigation}) => {
  const {callInvitation} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();
  const {resumeListening} = useIncomingCallListener(navigation);
  
  // State management
  const [isResponding, setIsResponding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds to respond
  const [pulseAnim] = useState(new Animated.Value(1));

  // Create pulsing animation for the avatar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    
    return () => pulse.stop();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired - automatically reject
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle timeout
  const handleTimeout = async () => {
    console.log('⏰ Call invitation timed out');
    
    try {
      await privateCallApi.rejectInvitation(callInvitation.Id, user.id);
      console.log('✅ Call automatically rejected due to timeout');
    } catch (error) {
      console.error('❌ Error auto-rejecting call:', error);
    }
    
    Alert.alert(
      'Call Missed',
      'The call invitation has expired.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Resume listening for incoming calls
            console.log('🔄 Resuming incoming call polling after timeout...');
            resumeListening();
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Accept call invitation
  const acceptCall = async () => {
    if (isResponding) return;
    
    console.log(`✅ Accepting call from ${callInvitation.CallerName}`);
    setIsResponding(true);
    
    try {
      const response = await privateCallApi.acceptInvitation(callInvitation.Id, user.id);
      
      if (response.success) {
        console.log('✅ Call accepted successfully:', response);
        
        // Navigate to private call screen
        navigation.replace('PrivateCall', {
          otherUser: {
            id: callInvitation.CallerId,
            username: callInvitation.CallerName,
            email: callInvitation.CallerEmail,
            role: callInvitation.CallerRole,
          },
          invitationId: callInvitation.Id,
          channelName: response.channelName || 'default-channel',
          isCallAccepted: true,
          isCaller: false, // This user is the receiver
          currentUserId: user.id, // Add current user ID for server monitoring
        });
      } else {
        Alert.alert(
          'Call Failed',
          response.message || 'Failed to accept the call. Please try again.',
          [{text: 'OK', onPress: () => {
            // Resume listening for incoming calls
            console.log('🔄 Resuming incoming call polling after failed accept...');
            resumeListening();
            navigation.goBack();
          }}]
        );
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      Alert.alert(
        'Call Failed',
        error.message || 'Failed to accept the call. Please try again.',
        [{text: 'OK', onPress: () => {
          // Resume listening for incoming calls
          console.log('🔄 Resuming incoming call polling after error in accept...');
          resumeListening();
          navigation.goBack();
        }}]
      );
    } finally {
      setIsResponding(false);
    }
  };

  // Reject call invitation
  const rejectCall = async () => {
    if (isResponding) return;
    
    console.log(`❌ Rejecting call from ${callInvitation.CallerName}`);
    setIsResponding(true);
    
    try {
      const response = await privateCallApi.rejectInvitation(callInvitation.Id, user.id);
      
      if (response.success) {
        console.log('✅ Call rejected successfully');
        // Resume listening for incoming calls
        console.log('🔄 Resuming incoming call polling after reject...');
        resumeListening();
        navigation.goBack();
      } else {
        console.error('❌ Failed to reject call:', response.message);
        // Even if rejection fails, go back - user doesn't want the call
        // Resume listening for incoming calls
        console.log('🔄 Resuming incoming call polling after failed reject...');
        resumeListening();
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      // Even if rejection fails, go back - user doesn't want the call
      // Resume listening for incoming calls
      console.log('🔄 Resuming incoming call polling after error in reject...');
      resumeListening();
      navigation.goBack();
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';
  const textColor = darkMode ? '#fff' : '#000';
  const cardColor = darkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>Incoming Call</Text>
        <Text style={[styles.timeRemaining, {color: timeLeft <= 10 ? '#ff4444' : textColor}]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerContainer}>
        <Animated.View 
          style={[
            styles.callerAvatar,
            {
              backgroundColor: '#4CAF50',
              transform: [{scale: pulseAnim}],
            }
          ]}
        >
          <Text style={styles.avatarText}>
            {callInvitation.CallerName.charAt(0).toUpperCase()}
          </Text>
        </Animated.View>
        
        <Text style={[styles.callerName, {color: textColor}]}>
          {callInvitation.CallerName}
        </Text>
        
        <Text style={[styles.callerDetails, {color: darkMode ? '#ccc' : '#666'}]}>
          {callInvitation.CallerEmail}
        </Text>
        
        <Text style={[styles.callerRole, {color: darkMode ? '#91aad4' : '#004080'}]}>
          {callInvitation.CallerRole}
        </Text>
      </View>

      {/* Call Message */}
      <View style={styles.messageContainer}>
        <Text style={[styles.messageText, {color: textColor}]}>
          is calling you...
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={rejectCall}
          disabled={isResponding}
        >
          <Text style={styles.rejectButtonText}>📞</Text>
          <Text style={styles.buttonLabel}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={acceptCall}
          disabled={isResponding}
        >
          <Text style={styles.acceptButtonText}>📞</Text>
          <Text style={styles.buttonLabel}>Accept</Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isResponding && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: textColor}]}>
            Responding...
          </Text>
        </View>
      )}
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
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timeRemaining: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  callerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  callerAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerDetails: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  callerRole: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  messageText: {
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    transform: [{rotate: '135deg'}],
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButtonText: {
    fontSize: 24,
    color: '#fff',
    transform: [{rotate: '-135deg'}],
  },
  acceptButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default IncomingCallScreen; 