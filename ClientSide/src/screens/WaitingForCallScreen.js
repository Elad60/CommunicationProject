import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Alert,
  Animated,
  NativeModules,
  ScrollView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';

const {AgoraModule} = NativeModules; // 🎯 NEW: Import AgoraModule

const WaitingForCallScreen = ({route, navigation}) => {
  const {otherUser, invitationId, channelName} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();

  // 🎯 NEW: Add responsive dimensions
  const {height, width} = useDebouncedDimensions(300);
  const isLandscape = width > height;

  const [waitingTime, setWaitingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [status, setStatus] = useState('Sending invitation...');
  const [isPolling, setIsPolling] = useState(false);
  const didShowRejectedAlertRef = useRef(false); // Prevent duplicate alert (sync)
  
  // Refs for interval management
  const waitingTimerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // 🎯 NEW: Calculate responsive sizes
  const avatarSize = Math.min(width * 0.2, 100); // Responsive avatar size
  const buttonSize = Math.min(width * 0.12, 50); // Responsive button size - reduced from 80 to 50
  const fontSize = Math.min(width * 0.035, 14); // Responsive font size
  const headerFontSize = Math.min(width * 0.05, 20); // Responsive header font size

  // Timer for waiting time (max 60 seconds)
  useEffect(() => {
    console.log('⏱️ Starting waiting timer...');
    waitingTimerRef.current = setInterval(() => {
      setWaitingTime(prev => {
        if (prev >= 59) {
          // 60 seconds timeout - only call once
          if (prev === 59) {
            handleTimeout();
          }
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => {
      console.log('🧹 Cleaning up waiting timer');
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
    };
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
      console.log(`👤 User ID: ${user.id}`);
      console.log(`🌐 API Base URL: http://localhost:7220/api`);
      console.log(`🎯 API Call will be: GET /PrivateCalls/status/${invitationId}/${user.id}`);
      
      setStatus('Waiting for response...');
      startPollingForResponse();
    }
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 WaitingForCallScreen unmounting - cleaning up all polling');
      stopPollingForResponse();
    };
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
    
    // Stop all polling first to prevent multiple calls
    stopPollingForResponse();
    setStatus('Call Timed Out');
    
    // Cancel the call on server (same as manual cancel)
    if (invitationId) {
      try {
        console.log('📤 Cancelling timed-out call on server...');
        const response = await privateCallApi.cancelInvitation(invitationId, user.id);
        
        if (response.success) {
          console.log('✅ Server confirmed timeout cancellation');
        } else {
          console.log('⚠️ Server could not cancel timed-out call (probably already changed status)');
        }
      } catch (error) {
        console.log('⚠️ Server timeout cancel failed (probably already changed status):', error.message);
        // This is OK - the call might already be accepted/expired/etc
      }
    }
    
    // Show timeout message and navigate back
    Alert.alert(
      'No Answer',
      `${otherUser.username} didn't respond to your call within 60 seconds.`,
      [{text: 'OK', onPress: () => {
        // GlobalCallListener will resume polling automatically
        console.log('📞 Call timed out - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      }}]
    );
  };

  // Poll for call response
  const startPollingForResponse = () => {
    console.log('🔄 Starting polling for call response...');
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
    }, 2000); // Poll every 2 seconds
    
    console.log('✅ Polling started with interval ID:', pollIntervalRef.current);
  };

  // Stop polling for call response
  const stopPollingForResponse = () => {
    console.log('🛑 Stopping polling for call response');
    setIsPolling(false);
    
    if (pollIntervalRef.current) {
      console.log('🧹 Clearing poll interval:', pollIntervalRef.current);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Separate function to check call status
  const checkCallStatus = async () => {
    console.log('🔍 checkCallStatus called, isPolling:', isPolling);
    
    try {
      console.log('🔄 Polling for call status...');
      const response = await privateCallApi.getCallStatus(invitationId, user.id);
      console.log('📊 Polling response:', JSON.stringify(response, null, 2));
      
      if (response.success) {  // ← Fixed: lowercase 'success'
        const currentStatus = response.status;  // ← Fixed: lowercase 'status'
        console.log(`🎯 Current status: "${currentStatus}"`);  // ← Added detailed logging
        
                  if (currentStatus === 'accepted') {
            console.log('✅ Call accepted! Navigating to private call...');
            
            // Stop all polling immediately to prevent loops
            console.log('🛑 STOPPING ALL POLLING - Call accepted');
            stopPollingForResponse();
            
            // 🎯 FIXED: Create proper channel name without duplication
            const agoraChannelName = invitationId;
            console.log('🎤 Connecting to Agora channel:', agoraChannelName);
            
            // 🎯 NEW: Add delay to ensure channel is created by the other user
            console.log('⏰ Waiting 2 seconds for channel to be created by the other user...');
            
            setTimeout(() => {
              try {
                // Same initialization as MainScreen
                if (!AgoraModule) {
                  throw new Error('AgoraModule not available');
                }
                
                // Don't re-initialize Agora - it's already initialized by VoiceContext
                // AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
                
                // Join the Agora channel directly
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
            }, 2000); // 🎯 2 second delay
            
            // Navigate to private call screen
            navigation.reset({
              index: 1,
              routes: [
                {name: 'Groups'},
                {
                  name: 'PrivateCall',
                  params: {
                    otherUser,
                    invitationId,
                    channelName: response.channelName || channelName,
                    agoraChannelName: agoraChannelName, // 🎯 Pass the calculated channel name
                    isCallAccepted: true,
                    isCaller: true, // This user is the caller
                    currentUserId: user.id, // Add current user ID for server monitoring
                  }
                }
              ]
            });
            
            // Return to prevent further execution
            return;
          
        } else if (currentStatus === 'rejected') {
          if (!didShowRejectedAlertRef.current) {
            didShowRejectedAlertRef.current = true;
            console.log('❌ Call rejected');
            stopPollingForResponse();
            setStatus('Call Rejected');
            Alert.alert(
              'Call Rejected',
              `${otherUser.username} declined your call.`,
              [{
                text: 'OK',
                onPress: () => {
                  setTimeout(() => {
                    // GlobalCallListener will resume polling automatically
                    console.log('📞 Call rejected - returning to Groups (GlobalCallListener will resume polling)');
                    navigation.reset({index:0, routes:[{name:'Groups'}]});
                  }, 150);
                }
              }]
            );
          }
          return;
        } else if (currentStatus === 'cancelled') {
          console.log('🚫 Call was cancelled');
          stopPollingForResponse();
          setStatus('Call Cancelled');
          // GlobalCallListener will resume polling automatically
          console.log('📞 Call cancelled - returning to Groups (GlobalCallListener will resume polling)');
          navigation.reset({index:0, routes:[{name:'Groups'}]});
          
        } else if (currentStatus === 'expired') {
          console.log('⏰ Call expired on server');
          stopPollingForResponse();
          setStatus('Call Expired');
          
          Alert.alert(
            'Call Expired',
            `The call invitation has expired.`,
            [{text: 'OK', onPress: () => {
              // GlobalCallListener will resume polling automatically
              console.log('📞 Call expired - returning to Groups (GlobalCallListener will resume polling)');
              navigation.reset({index:0, routes:[{name:'Groups'}]});
            }}]
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
  };

  // Cancel call with confirmation
  const handleCancelCall = async () => {
    console.log('🚫 User requested to cancel call');
    
    // Show confirmation dialog
    Alert.alert(
      'Cancel Call',
      `Are you sure you want to cancel the call to ${otherUser.username}?`,
      [
        {
          text: 'Keep Waiting',
          style: 'cancel',
          onPress: () => console.log('User chose to keep waiting')
        },
        {
          text: 'Cancel Call',
          style: 'destructive',
          onPress: () => performCancelCall()
        }
      ]
    );
  };

  // Perform the actual cancellation
  const performCancelCall = async () => {
    console.log('🚫 User wants to cancel call - stopping polling immediately');
    
    // Stop polling immediately regardless of server response
    stopPollingForResponse();
    setStatus('Cancelling call...');
    
    // Try to cancel on server, but don't fail if it doesn't work
    if (invitationId) {
      try {
        console.log('📤 Attempting to cancel on server...');
        const response = await privateCallApi.cancelInvitation(invitationId, user.id);
        
        if (response.success) {
          console.log('✅ Server confirmed cancellation');
        } else {
          console.log('⚠️ Server could not cancel (probably already changed status)');
        }
      } catch (error) {
        console.log('⚠️ Server cancel failed (probably already changed status):', error.message);
        // This is OK - the call might already be accepted/expired/etc
      }
    }
    
    // Always navigate back successfully - user wants to leave
    console.log('✅ Navigating back to Groups');
    setStatus('Call Cancelled');
    
    Alert.alert(
      'Call Cancelled',
      `You have left the call to ${otherUser.username}.`,
      [{text: 'OK', onPress: () => {
        // GlobalCallListener will resume polling automatically
        console.log('📞 User cancelled call - returning to Groups (GlobalCallListener will resume polling)');
        navigation.reset({index:0, routes:[{name:'Groups'}]});
      }}]
    );
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: textColor, fontSize: headerFontSize}]}>Calling...</Text>
          <Text style={[styles.waitingTime, {color: waitingTime >= 50 ? '#ff4444' : textColor, fontSize: fontSize}]}>
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
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Text style={[styles.avatarText, {color: '#fff', fontSize: avatarSize * 0.4}]}>
              {otherUser.username.charAt(0).toUpperCase()}
            </Text>
          </Animated.View>
          
          <Text style={[styles.username, {color: textColor, fontSize: fontSize * 1.3}]}>
            {otherUser.username}
          </Text>
          <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            {otherUser.email}
          </Text>
          <Text style={[styles.status, {color: darkMode ? '#91aad4' : '#004080', fontSize: fontSize}]}>
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
          <Text style={[styles.callingText, {color: textColor, fontSize: fontSize}]}>
            📞 Waiting for {otherUser.username} to answer...
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#ff4444'}]}
            onPress={handleCancelCall}
          >
            <Text style={[styles.actionButtonText, {fontSize: fontSize}]}>🚫 Cancel Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#2196F3'}]}
            onPress={() => {
              Alert.alert(
                'Call Information',
                `📞 Calling: ${otherUser.username}\n` +
                `📧 Email: ${otherUser.email}\n` +
                `🆔 Invitation ID: ${invitationId}\n` +
                `📡 Channel: ${channelName}\n` +
                `⏰ Waiting: ${formatWaitingTime(waitingTime)}\n` +
                `🔄 Status: ${status}`,
                [{text: 'OK'}]
              );
            }}
          >
            <Text style={[styles.actionButtonText, {fontSize: fontSize}]}>ℹ️ Call Info</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsTitle, {color: textColor, fontSize: fontSize}]}>
            Call Status:
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            📧 Invitation sent to {otherUser.username}
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            ⏰ They have 60 seconds to respond
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            📱 Channel: {channelName}
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            🔄 Checking for response every 2 seconds
          </Text>
          <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>
            🚫 You can cancel the call at any time
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waitingTime: {
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontWeight: 'bold',
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    marginBottom: 10,
  },
  status: {
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
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    gap: 16, // Reduced from 24 to 16 for better proportion
  },
  actionButton: {
    flex: 1,
    padding: 12, // Reduced from 15 to 12
    borderRadius: 20, // Reduced from 25 to 20
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 120, // Reduced from 140 to 120
    maxWidth: 180, // Reduced from 220 to 180
    marginHorizontal: 8, // Reduced from 12 to 8
    minHeight: 44, // Added minimum height for better touch target
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 'auto',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  instructionsTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    marginBottom: 5,
  },
});

export default WaitingForCallScreen; 