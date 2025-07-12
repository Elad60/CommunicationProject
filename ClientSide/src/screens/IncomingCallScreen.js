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

const IncomingCallScreen = ({route, navigation}) => {
  const {callInvitation} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();
  
  // ✅ FIX: Handle case sensitivity for server response
  const callId = callInvitation.Id || callInvitation.id;
  const callerName = callInvitation.CallerName || callInvitation.callerName;
  const callerEmail = callInvitation.CallerEmail || callInvitation.callerEmail;
  const callerRole = callInvitation.CallerRole || callInvitation.callerRole;
  const callerId = callInvitation.CallerId || callInvitation.callerId;
  
  console.log('📞 IncomingCallScreen: Call invitation details:', JSON.stringify(callInvitation, null, 2));
  console.log('📞 IncomingCallScreen: Extracted values:', {callId, callerName, callerEmail, callerRole, callerId});
  
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
      await privateCallApi.rejectInvitation(callId, user.id);
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
                      // GlobalCallListener will resume polling automatically
          console.log('📞 Call timed out - returning to Groups (GlobalCallListener will resume polling)');
          navigation.reset({index:0, routes:[{name:'Groups'}]});
          },
        },
      ]
    );
  };

  // Accept call invitation
  const acceptCall = async () => {
    if (isResponding) return;
    
    console.log(`✅ Accepting call from ${callerName}`);
    setIsResponding(true);
    
    try {
      const response = await privateCallApi.acceptInvitation(callId, user.id);
      
      if (response.success) {
        console.log('✅ Call accepted successfully:', response);
        
        // Navigate to private call screen
        navigation.reset({
          index: 1,
          routes: [
            {name: 'Groups'},
            {
              name: 'PrivateCall',
              params: {
                otherUser: {
                  id: callerId,
                  username: callerName,
                  email: callerEmail,
                  role: callerRole,
                },
                invitationId: callId,
                channelName: response.channelName || 'default-channel',
                isCallAccepted: true,
                isCaller: false, // This user is the receiver
                currentUserId: user.id, // Add current user ID for server monitoring
              }
            }
          ]
        });
      } else {
        Alert.alert(
          'Call Failed',
          response.message || 'Failed to accept the call. Please try again.',
          [{text: 'OK', onPress: () => {
            // GlobalCallListener will resume polling automatically
            console.log('📞 Failed to accept call - returning to Groups (GlobalCallListener will resume polling)');
            navigation.reset({index:0, routes:[{name:'Groups'}]});
          }}]
        );
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      Alert.alert(
        'Call Failed',
        error.message || 'Failed to accept the call. Please try again.',
        [{text: 'OK', onPress: () => {
          // GlobalCallListener will resume polling automatically
          console.log('📞 Error accepting call - returning to Groups (GlobalCallListener will resume polling)');
          navigation.reset({index:0, routes:[{name:'Groups'}]});
        }}]
      );
    } finally {
      setIsResponding(false);
    }
  };

  // Reject call invitation
  const rejectCall = async () => {
    if (isResponding) return;
    
    console.log(`❌ Rejecting call from ${callerName}`);
    setIsResponding(true);
    
    try {
      const response = await privateCallApi.rejectInvitation(callId, user.id);
      
      if (response.success) {
        console.log('✅ Call rejected successfully');
        // GlobalCallListener will resume polling automatically
        console.log('📞 Call rejected - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      } else {
        console.error('❌ Failed to reject call:', response.message);
        // Even if rejection fails, go back - user doesn't want the call
        // GlobalCallListener will resume polling automatically
        console.log('📞 Failed to reject call - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      // Even if rejection fails, go back - user doesn't want the call
      // GlobalCallListener will resume polling automatically
      console.log('📞 Error rejecting call - returning to Groups (GlobalCallListener will resume polling)');
      navigation.reset({index:0, routes:[{name:'Groups'}]});
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
            {callerName.charAt(0).toUpperCase()}
          </Text>
        </Animated.View>
        
        <Text style={[styles.callerName, {color: textColor}]}>
          {callerName}
        </Text>
        
        <Text style={[styles.callerDetails, {color: darkMode ? '#ccc' : '#666'}]}>
          {callerEmail}
        </Text>
        
        <Text style={[styles.callerRole, {color: darkMode ? '#91aad4' : '#004080'}]}>
          {callerRole}
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
        {/* Decline Button */}
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.rejectButton,
            {
              opacity: isResponding ? 0.6 : 1,
              transform: isResponding ? [{scale: 0.95}, {rotate: '135deg'}] : [{rotate: '135deg'}]
            }
          ]}
          onPress={rejectCall}
          disabled={isResponding}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={[styles.rejectButtonIcon, {transform: [{rotate: '-135deg'}]}]}>📞</Text>
            <Text style={[styles.rejectButtonLabel, {transform: [{rotate: '-135deg'}]}]}>Decline</Text>
          </View>
        </TouchableOpacity>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.acceptButton,
            {
              opacity: isResponding ? 0.6 : 1,
              transform: isResponding ? [{scale: 0.95}] : [{scale: 1}]
            }
          ]}
          onPress={acceptCall}
          disabled={isResponding}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.acceptButtonIcon}>📞</Text>
            <Text style={styles.acceptButtonLabel}>Accept</Text>
          </View>
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
    paddingHorizontal: 40,
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginHorizontal: 20,
  },
  rejectButton: {
    backgroundColor: '#ff3333',
    borderWidth: 3,
    borderColor: '#ff6666',
    shadowColor: '#ff0000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  acceptButton: {
    backgroundColor: '#00cc00',
    borderWidth: 3,
    borderColor: '#33ff33',
    shadowColor: '#00aa00',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  rejectButtonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  acceptButtonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
  },
  acceptButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
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