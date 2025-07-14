import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  Animated,
  NativeModules,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';

const {AgoraModule} = NativeModules; // 🎯 NEW: Import AgoraModule

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
  const [isPolling, setIsPolling] = useState(false);
  
  // Refs for cleanup
  const pollIntervalRef = useRef(null);
  const timerRef = useRef(null);

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
    console.log('⏱️ Starting 60-second countdown timer');
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired - automatically reject
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log('🧹 Cleaning up countdown timer');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Start polling for call status when component mounts
  useEffect(() => {
    console.log('📞 IncomingCallScreen: Starting call status polling');
    startPollingForStatus();
    
    return () => {
      console.log('🧹 IncomingCallScreen: Cleanup - stopping all polling');
      stopPollingForStatus();
    };
  }, []);

  // Start polling for call status
  const startPollingForStatus = () => {
    console.log('🔄 Starting polling for call status...');
    setIsPolling(true);
    
    // Clear any existing interval first
    if (pollIntervalRef.current) {
      console.log('🧹 Clearing existing poll interval');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // Start immediate first call
    checkCallStatus();
    
    // Store interval reference so we can clear it later
    pollIntervalRef.current = setInterval(() => {
      checkCallStatus();
    }, 3000); // Poll every 3 seconds
    
    console.log('✅ Call status polling started with interval ID:', pollIntervalRef.current);
  };

  // Stop polling for call status
  const stopPollingForStatus = () => {
    console.log('🛑 Stopping call status polling');
    setIsPolling(false);
    
    if (pollIntervalRef.current) {
      console.log('🧹 Clearing call status poll interval:', pollIntervalRef.current);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Check call status
  const checkCallStatus = async () => {
    if (!callId || !user?.id) {
      console.log('⚠️ Missing callId or userId for status check');
      return;
    }
    
    try {
      console.log('🔍 Checking call status for invitation:', callId);
      const response = await privateCallApi.getCallStatus(callId, user.id);
      
      console.log('📋 Call status response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const status = response.status || response.Status;
        console.log('📊 Call status:', status);
        
        switch (status) {
          case 'cancelled':
          case 'Cancelled':
            console.log('🚫 Call was cancelled by caller');
            handleCallerCancelled();
            break;
            
          case 'expired':
          case 'Expired':
            console.log('⏰ Call expired');
            handleCallExpired();
            break;
            
          case 'pending':
          case 'Pending':
            // Still waiting - this is normal
            console.log('⏳ Call still pending');
            break;
            
          default:
            console.log('📞 Call status:', status);
        }
      } else {
        console.log('⚠️ Failed to get call status:', response);
      }
    } catch (error) {
      console.error('❌ Error checking call status:', error);
    }
  };

  // Handle when caller cancels the call
  const handleCallerCancelled = () => {
    console.log('🚫 Caller cancelled - stopping all timers and polling');
    
    // Stop all timers and polling
    stopPollingForStatus();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    Alert.alert(
      'Call Cancelled',
      `${callerName} cancelled the call.`,
      [{text: 'OK', onPress: () => {
        console.log('📞 Caller cancelled - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      }}]
    );
  };

  // Handle when call expires on server
  const handleCallExpired = () => {
    console.log('⏰ Call expired on server - stopping all timers and polling');
    
    // Stop all timers and polling
    stopPollingForStatus();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    Alert.alert(
      'Call Expired',
      'The call invitation has expired.',
      [{text: 'OK', onPress: () => {
        console.log('📞 Call expired - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      }}]
    );
  };

  // Handle timeout
  const handleTimeout = async () => {
    console.log('⏰ Call invitation timed out');
    
    // Stop all timers and polling
    stopPollingForStatus();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
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
    
    // Stop polling since we're accepting
    stopPollingForStatus();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      const response = await privateCallApi.acceptInvitation(callId, user.id);
      
      if (response.success) {
        console.log('✅ Call accepted successfully:', response);
        
        // 🎯 FIXED: Create proper channel name without duplication
        const agoraChannelName = callId;
        console.log('🎤 Connecting to Agora channel:', agoraChannelName);
        
        try {
          // Same initialization as MainScreen
          if (!AgoraModule) {
            throw new Error('AgoraModule not available');
          }
          
          // Initialize Agora engine (same as MainScreen)
          AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
          
          // Join the Agora channel (same as MainScreen)
          AgoraModule.JoinChannel(agoraChannelName);
          
          console.log('✅ Successfully connected to Agora channel:', agoraChannelName);
        } catch (agoraError) {
          console.error('❌ Failed to connect to Agora:', agoraError);
          Alert.alert(
            'Voice Connection Failed',
            'Call accepted but voice connection failed. You can still communicate via text.',
            [{text: 'OK'}]
          );
        }
        
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
                agoraChannelName: agoraChannelName, // 🎯 Pass the calculated channel name
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
    
    // Stop polling since we're rejecting
    stopPollingForStatus();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
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
              transform: isResponding ? [{scale: 0.95}] : [{scale: 1}]
            }
          ]}
          onPress={rejectCall}
          disabled={isResponding}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.rejectButtonIcon}>✖️</Text>
            <Text style={styles.rejectButtonLabel}>Decline</Text>
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
    backgroundColor: '#e74c3c',
    borderWidth: 3,
    borderColor: '#c0392b',
    shadowColor: '#c0392b',
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
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  acceptButtonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
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