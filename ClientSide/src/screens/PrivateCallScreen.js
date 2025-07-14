import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  BackHandler,
  NativeModules,
} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';

const {AgoraModule} = NativeModules; // 🎯 NEW: Import AgoraModule

const PrivateCallScreen = ({route, navigation}) => {
  const {otherUser, invitationId, currentUserId, channelName, agoraChannelName, isCaller, isCallAccepted} = route.params; // 🎯 NEW: Extract agoraChannelName
  const {darkMode} = useSettings();
  const [callDuration, setCallDuration] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isAgoraConnected, setIsAgoraConnected] = useState(false); // 🎯 NEW: Track Agora connection
  const intervalRef = useRef(null);
  const statusCheckRef = useRef(null);
  
  console.log('🔵 PrivateCallScreen mounted with:', {
    otherUser: otherUser?.username,
    invitationId,
    currentUserId,
    agoraChannelName, // 🎯 Channel name from previous screen
  });
  
  // 🔧 VALIDATION: Check if channel name has duplicate 'call_'
  if (agoraChannelName && agoraChannelName.includes('call_call_')) {
    console.warn('⚠️ DUPLICATE DETECTED in channel name:', agoraChannelName);
  }

  // 🎯 FIXED: Set Agora state only once on mount
  useEffect(() => {
    console.log('🎤 PrivateCallScreen: Agora already connected from previous screen to:', agoraChannelName);
    
    if (agoraChannelName) {
      // Set the connection state to true since we're already connected
      setIsAgoraConnected(true);
    } else {
      console.log('⚠️ No Agora channel name provided - voice disabled');
    }

    return () => {
      console.log('🧹 Cleaning up Agora connection (FORCE CLEANUP)...');
      // 🔧 FIX: Force cleanup multiple times to ensure disconnect
      disconnectFromAgora();
      setTimeout(() => {
        disconnectFromAgora(); // Second attempt
      }, 100);
    };
  }, []); // Empty dependency array - run only once

  // Component lifecycle logging with cleanup
  useEffect(() => {
    console.log('🎬 PrivateCallScreen MOUNTED');
    return () => {
      console.log('🏁 PrivateCallScreen UNMOUNTED - FORCE cleaning up all resources');
      // 🔧 FIX: Final force disconnect on unmount
      if (AgoraModule) {
        try {
          AgoraModule.LeaveChannel(); // Force final disconnect
          console.log('✅ Final Agora disconnect on unmount');
        } catch (error) {
          console.error('❌ Error in final disconnect:', error);
        }
      }
    };
  }, []);

  // Connect to Agora voice channel (FOR MANUAL RECONNECTION ONLY)
  const connectToAgora = async () => {
    try {
      if (!AgoraModule) {
        throw new Error('AgoraModule not available');
      }

      console.log('🎤 Manually connecting to Agora channel:', agoraChannelName);
      
      // Initialize Agora engine
      AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
      
      // Join the Agora channel
      AgoraModule.JoinChannel(agoraChannelName);
      setIsAgoraConnected(true);
      console.log('✅ Successfully connected to Agora channel (manual reconnect):', agoraChannelName);
      
    } catch (error) {
      console.error('❌ Failed to connect to Agora:', error);
      Alert.alert(
        'Voice Connection Failed',
        'Voice connection failed. You can still communicate via text.',
        [{text: 'OK'}]
      );
    }
  };

  // Disconnect from Agora voice channel (IMPROVED VERSION - MORE RELIABLE)
  const disconnectFromAgora = () => {
    try {
      console.log('🎤 Disconnecting from Agora channel (FORCE DISCONNECT)...');
      
      // 🔧 FIX: Always try to disconnect, don't rely on state
      if (AgoraModule) {
        AgoraModule.LeaveChannel(); // Force disconnect regardless of state
        console.log('✅ Successfully disconnected from Agora (FORCED)');
      }
      
      // Update state after successful disconnect
      setIsAgoraConnected(false);
      
    } catch (error) {
      console.error('❌ Error disconnecting from Agora:', error);
      // Even if error, update state to prevent stuck connections
      setIsAgoraConnected(false);
    }
  };

  // Start call duration timer
  useEffect(() => {
    console.log('⏱️ Starting call duration timer...');
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Monitor call status - check if other user disconnected
  useEffect(() => {
    console.log('👁️ Starting call status monitoring...');
    
    let isMonitoring = true; // Flag to prevent multiple alerts
    let intervalId = null; // Store interval ID locally
    
    const checkCallStatus = async () => {
      console.log('🔍 checkCallStatus called, isMonitoring:', isMonitoring, 'isCallActive:', isCallActive);
      
      // Don't check if we're no longer monitoring
      if (!isMonitoring) {
        console.log('🛑 Stopping call status check - monitoring stopped');
        return;
      }
      
      // Don't check if call is not active
      if (!isCallActive) {
        console.log('🛑 Stopping call status check - call not active');
        return;
      }
      
      try {
        console.log('🔄 Polling for call status...');
        const response = await privateCallApi.getCallStatus(invitationId, currentUserId);
        
        if (response.success) {
          console.log('📊 Call status:', response.status);
          
          // If call was ended by the other user
          if (response.status === 'cancelled' || response.status === 'ended') {
            console.log('❌ Call ended by other user');
            
            // 🔧 FIX: FORCE disconnect from Agora IMMEDIATELY (multiple attempts)
            console.log('🎤 Other user ended call - FORCE disconnecting from Agora...');
            disconnectFromAgora(); // First attempt
            
            // Wait and try again to ensure disconnect
            setTimeout(() => {
              disconnectFromAgora(); // Second attempt
            }, 100);
            
            // Stop monitoring IMMEDIATELY
            isMonitoring = false;
            setIsCallActive(false);
            
            // Clear the interval IMMEDIATELY
            if (intervalId) {
              console.log('🧹 Clearing local interval:', intervalId);
              clearInterval(intervalId);
              intervalId = null;
            }
            if (statusCheckRef.current) {
              console.log('🧹 Clearing ref interval:', statusCheckRef.current);
              clearInterval(statusCheckRef.current);
              statusCheckRef.current = null;
            }
            
            // Final disconnect attempt before showing alert
            setTimeout(() => {
              disconnectFromAgora(); // Final attempt
            }, 200);
            
            // Show notification and navigate back
            Alert.alert(
              'Call Ended',
              'The other user has ended the call.',
              [
                {
                  text: 'OK',
                                      onPress: () => {
                      console.log('📞 Other user ended call - returning to Groups (GlobalCallListener will resume polling)');
                      navigation.reset({index:0, routes:[{name:'Groups'}]});
                    },
                },
              ],
              { cancelable: false }
            );
            
            return; // Stop execution
          }
        }
      } catch (error) {
        console.error('❌ Error checking call status:', error);
        // Continue monitoring even if there's an error
      }
    };

    // Check immediately
    checkCallStatus();
    
    // Then check every 3 seconds
    intervalId = setInterval(checkCallStatus, 3000);
    statusCheckRef.current = intervalId;
    console.log('✅ Started polling with interval ID:', intervalId);

    return () => {
      console.log('🧹 Cleaning up call status monitoring, interval ID:', intervalId);
      isMonitoring = false; // Stop monitoring on cleanup
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = null;
      }
    };
  }, [invitationId, currentUserId, navigation]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle call end (IMPROVED WITH PROTECTION AGAINST MULTIPLE CALLS)
  const handleEndCall = async () => {
    // 🔧 FIX: Protection against multiple calls
    if (isEnding) {
      console.log('⚠️ Call already ending, skipping...');
      return;
    }
    
    console.log('🔴 Ending call...');
    setIsEnding(true);
    setIsCallActive(false);
    
    // 🔧 FIX: Force disconnect from Agora MULTIPLE TIMES to ensure it works
    console.log('🎤 FORCE disconnecting from Agora before ending call...');
    disconnectFromAgora(); // First attempt
    
    // Wait a bit and try again to make sure
    setTimeout(() => {
      disconnectFromAgora(); // Second attempt after small delay
    }, 100);
    
    // Stop all timers IMMEDIATELY
    console.log('🛑 Stopping all timers...');
    if (intervalRef.current) {
      console.log('🧹 Clearing duration timer:', intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (statusCheckRef.current) {
      console.log('🧹 Clearing status check timer:', statusCheckRef.current);
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
    
    try {
      const response = await privateCallApi.endCall(invitationId, 'user_hangup');
      
      if (response.success) {
        console.log('✅ Call ended successfully');
      } else {
        console.error('❌ Failed to end call:', response.message);
      }
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
    
    // 🔧 FIX: One more disconnect attempt before leaving
    disconnectFromAgora(); // Final attempt
    
    // Always navigate back, even if API call fails
    console.log('📞 User ended call - returning to Groups (GlobalCallListener will resume polling)');
    navigation.reset({index:0, routes:[{name:'Groups'}]});
  };

  // Check Agora connection status (REPLACE TEST FEATURES)
  const checkAgoraStatus = () => {
    console.log('🔍 Checking Agora status...');
    
    let statusMessage = '🎤 AGORA CONNECTION STATUS:\n\n';
    
    // Check AgoraModule availability
    if (!AgoraModule) {
      statusMessage += '❌ AgoraModule: NOT AVAILABLE\n';
      statusMessage += '🚨 Critical: Agora SDK not loaded\n\n';
    } else {
      statusMessage += '✅ AgoraModule: AVAILABLE\n';
    }
    
    // Check connection status
    if (isAgoraConnected) {
      statusMessage += '✅ Connection Status: CONNECTED\n';
      statusMessage += `🔗 Channel Name: ${agoraChannelName}\n`;
      statusMessage += '🔊 Voice: ACTIVE\n';
    } else {
      statusMessage += '❌ Connection Status: DISCONNECTED\n';
      statusMessage += '🔇 Voice: INACTIVE\n';
    }
    
    // Check channel info
    if (agoraChannelName) {
      statusMessage += `\n📺 Expected Channel: ${agoraChannelName}\n`;
    } else {
      statusMessage += '\n⚠️ No channel name provided\n';
    }
    
    // Instructions
    statusMessage += '\n🛠️ TROUBLESHOOTING:\n';
    statusMessage += '• If disconnected: Try reconnecting\n';
    statusMessage += '• If no sound: Check other device\n';
    statusMessage += '• If issues persist: Restart call\n';
    
    Alert.alert(
      '🎤 Agora Status Check',
      statusMessage,
      [
        {
          text: '🔄 Reconnect',
          onPress: () => {
            console.log('🔄 User requested Agora reconnection');
            disconnectFromAgora();
            setTimeout(() => {
              connectToAgora();
            }, 500);
          }
        },
        {text: '✅ OK'}
      ]
    );
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';
  const textColor = darkMode ? '#fff' : '#000';
  const cardColor = darkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>Private Call</Text>
        <Text style={[styles.duration, {color: textColor}]}>
          Duration: {formatDuration(callDuration)}
        </Text>
        <Text style={[styles.status, {color: '#4CAF50'}]}>
          {isCallActive ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* User Info */}
      <View style={[styles.userInfo, {backgroundColor: cardColor}]}>
        <View style={styles.userAvatar}>
          <Text style={[styles.avatarText, {color: '#fff'}]}>
            {otherUser.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <Text style={[styles.username, {color: textColor}]}>
          {otherUser.username}
        </Text>
        <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666'}]}>
          {otherUser.email}
        </Text>
        <Text style={[styles.role, {color: darkMode ? '#91aad4' : '#004080'}]}>
          You are the {isCaller ? 'Caller' : 'Receiver'}
        </Text>
      </View>

      {/* Call Info */}
      <View style={[styles.callInfo, {backgroundColor: cardColor}]}>
        <Text style={[styles.infoTitle, {color: textColor}]}>Call Status</Text>
        <Text style={[styles.infoText, {color: isAgoraConnected ? '#4CAF50' : '#f44336'}]}>
          🔊 Voice: {isAgoraConnected ? 'Connected' : 'Disconnected'}
        </Text>
        <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666'}]}>
          📡 Channel: {channelName}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.voiceStatusButton, {backgroundColor: isAgoraConnected ? '#4CAF50' : '#ff9800'}]}
          onPress={checkAgoraStatus}
        >
          <Text style={styles.controlButtonText}>
            {isAgoraConnected ? '🔊 Voice Status' : '🔧 Check Voice'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.endCallButton, {backgroundColor: '#f44336'}]}
          onPress={handleEndCall}
        >
          <Text style={styles.endCallButtonText}>✖️ End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666'}]}>
          🎤 Voice communication active • Tap status to check connection
        </Text>
        <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔄 Use voice status button if audio issues occur
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  duration: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
  },
  userInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
  },
  callInfo: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 3,
  },
  actionButtonsContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  voiceStatusButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  endCallButton: {
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  endCallButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 'auto',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  instructionsText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 3,
    fontStyle: 'italic',
  },
});

export default PrivateCallScreen; 