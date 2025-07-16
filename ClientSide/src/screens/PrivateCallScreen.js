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
  ScrollView,
} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';

const {AgoraModule} = NativeModules; // 🎯 NEW: Import AgoraModule

const PrivateCallScreen = ({route, navigation}) => {
  const {otherUser, invitationId, currentUserId, channelName, agoraChannelName, isCaller, isCallAccepted} = route.params; // 🎯 NEW: Extract agoraChannelName
  const {darkMode} = useSettings();
  
  // 🎯 NEW: Add responsive dimensions
  const {height, width} = useDebouncedDimensions(300);
  const isLandscape = width > height;
  
  const [callDuration, setCallDuration] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isAgoraConnected, setIsAgoraConnected] = useState(false); // 🎯 NEW: Track Agora connection
  const intervalRef = useRef(null);
  const statusCheckRef = useRef(null);
  
  // 🎯 NEW: Calculate responsive sizes
  const avatarSize = Math.min(width * 0.15, 80); // Responsive avatar size
  const buttonSize = Math.min(width * 0.12, 60); // Responsive button size
  const fontSize = Math.min(width * 0.03, 12); // Responsive font size
  const headerFontSize = Math.min(width * 0.045, 18); // Responsive header font size
  
  // 🎯 NEW: Calculate container widths
  const containerWidth = Math.min(width * 0.99, 900); // Responsive container width
  const endCallButtonSize = Math.min(width * 0.10, 64); // Smaller end call button

  // NEW: Mute states (visual only)
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isHeadphonesMuted, setIsHeadphonesMuted] = useState(false);
  
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
      // 🎤 NEW: Reset audio states on cleanup
      if (AgoraModule) {
        try {
          AgoraModule.MuteLocalAudio(false);
          AgoraModule.EnableLocalAudio(true);
          console.log('✅ Audio states reset on cleanup');
        } catch (error) {
          console.error('❌ Error resetting audio states on cleanup:', error);
        }
      }
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
      // 🎤 NEW: Reset audio states on unmount
      if (AgoraModule) {
        try {
          // Reset audio states
          AgoraModule.MuteLocalAudio(false);
          AgoraModule.EnableLocalAudio(true);
          console.log('✅ Audio states reset on unmount');
          
          // Force final disconnect
          AgoraModule.LeaveChannel(); // Force final disconnect
          console.log('✅ Final Agora disconnect on unmount');
        } catch (error) {
          console.error('❌ Error in final cleanup:', error);
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
      
      // 🎯 NEW: Add delay for manual reconnection
      console.log('⏰ Waiting 1 second before manual reconnection...');
      
      setTimeout(() => {
        try {
          // Don't re-initialize Agora - it's already initialized by VoiceContext
          // AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
          
          // Join the Agora channel directly
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
      }, 1000); // 🎯 1 second delay for manual reconnection
      
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
      
      // 🎤 NEW: Reset audio states before disconnecting
      if (AgoraModule) {
        try {
          AgoraModule.MuteLocalAudio(false);
          AgoraModule.EnableLocalAudio(true);
          setIsMicMuted(false);
          setIsHeadphonesMuted(false);
          console.log('✅ Audio states reset before disconnect');
        } catch (audioError) {
          console.error('❌ Error resetting audio states:', audioError);
        }
        
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
            
            // 🎤 NEW: Reset audio states when other user ends call
            console.log('🎤 Other user ended call - resetting audio states...');
            if (AgoraModule) {
              try {
                // Unmute microphone and enable audio output
                AgoraModule.MuteLocalAudio(false);
                AgoraModule.EnableLocalAudio(true);
                setIsMicMuted(false);
                setIsHeadphonesMuted(false);
                console.log('✅ Audio states reset successfully');
              } catch (error) {
                console.error('❌ Error resetting audio states:', error);
              }
            }
            
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
    
    // 🎤 NEW: Reset audio states before ending call
    console.log('🎤 Resetting audio states...');
    if (AgoraModule) {
      try {
        // Unmute microphone and enable audio output
        AgoraModule.MuteLocalAudio(false);
        AgoraModule.EnableLocalAudio(true);
        setIsMicMuted(false);
        setIsHeadphonesMuted(false);
        console.log('✅ Audio states reset successfully');
      } catch (error) {
        console.error('❌ Error resetting audio states:', error);
      }
    }
    
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

  // 🎤 NEW: Handle microphone mute/unmute with real Agora control
  const handleMicMute = async () => {
    try {
      if (!AgoraModule) {
        console.log('⚠️ AgoraModule not available for mic control');
        return;
      }

      const newMuteState = !isMicMuted;
      console.log(`🎤 ${newMuteState ? 'Muting' : 'Unmuting'} microphone...`);
      
      // Use AgoraModule to actually mute/unmute the microphone
      AgoraModule.MuteLocalAudio(newMuteState);
      
      // Update visual state
      setIsMicMuted(newMuteState);
      
      console.log(`✅ Microphone ${newMuteState ? 'muted' : 'unmuted'} successfully`);
      
      // Show user feedback
      Alert.alert(
        'Microphone Status',
        `Microphone ${newMuteState ? 'muted' : 'unmuted'}`,
        [{text: 'OK'}],
        {cancelable: true}
      );
      
    } catch (error) {
      console.error('❌ Error controlling microphone:', error);
      Alert.alert(
        'Microphone Error',
        'Failed to control microphone. Please try again.',
        [{text: 'OK'}]
      );
    }
  };

  // 🎧 NEW: Handle headphones mute/unmute with real Agora control
  const handleHeadphonesMute = async () => {
    try {
      if (!AgoraModule) {
        console.log('⚠️ AgoraModule not available for headphones control');
        return;
      }

      const newMuteState = !isHeadphonesMuted;
      console.log(`🎧 ${newMuteState ? 'Muting' : 'Unmuting'} headphones...`);
      
      // Use AgoraModule to control audio output (this will mute/unmute what user hears)
      AgoraModule.EnableLocalAudio(!newMuteState); // Invert because EnableLocalAudio(true) = can hear
      
      // Update visual state
      setIsHeadphonesMuted(newMuteState);
      
      console.log(`✅ Headphones ${newMuteState ? 'muted' : 'unmuted'} successfully`);
      
      // Show user feedback
      Alert.alert(
        'Audio Output Status',
        `Audio output ${newMuteState ? 'muted' : 'unmuted'}`,
        [{text: 'OK'}],
        {cancelable: true}
      );
      
    } catch (error) {
      console.error('❌ Error controlling headphones:', error);
      Alert.alert(
        'Audio Output Error',
        'Failed to control audio output. Please try again.',
        [{text: 'OK'}]
      );
    }
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
        {/* Main Container with limited width */}
        <View style={[styles.mainContainer, {width: containerWidth, alignItems: 'center'}]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: textColor, fontSize: headerFontSize}]}>Private Call</Text>
            <Text style={[styles.duration, {color: textColor, fontSize: fontSize}]}>Duration: {formatDuration(callDuration)}</Text>
            <Text style={[styles.status, {color: '#4CAF50', fontSize: fontSize}]}>{isCallActive ? 'Connected' : 'Disconnected'}</Text>
          </View>

          {/* User Info */}
          <View style={[styles.userInfo, {backgroundColor: cardColor, alignItems: 'center'}]}>
            <View style={[styles.userAvatar, {width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2}]}>
              <Text style={[styles.avatarText, {color: '#fff', fontSize: avatarSize * 0.4}]}>{otherUser.username.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.username, {color: textColor, fontSize: fontSize * 1.2}]}>{otherUser.username}</Text>
            <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>{otherUser.email}</Text>
            <Text style={[styles.role, {color: darkMode ? '#91aad4' : '#004080', fontSize: fontSize}]}>You are the {isCaller ? 'Caller' : 'Receiver'}</Text>
          </View>

          {/* Call Info */}
          <View style={[styles.callInfo, {backgroundColor: cardColor, alignItems: 'center'}]}> 
            <Text style={[styles.infoTitle, {color: textColor, fontSize: fontSize, textAlign: 'center'}]}>Call Status</Text>
            <Text style={[styles.infoText, {color: isAgoraConnected ? '#4CAF50' : '#f44336', fontSize: fontSize, textAlign: 'center'}]}>🔊 Voice: {isAgoraConnected ? 'Connected' : 'Disconnected'}</Text>
            <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize, textAlign: 'center'}]}>📡 Channel: {channelName}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {/* Mute Mic */}
            <TouchableOpacity
              style={[styles.muteButton, isMicMuted ? styles.muteButtonActive : null]}
              onPress={handleMicMute}
            >
              <Text style={{fontSize: 28}}>{isMicMuted ? '🎤❌' : '🎤'}</Text>
              <Text style={styles.muteButtonText}>{isMicMuted ? 'Mic Off' : 'Mic On'}</Text>
            </TouchableOpacity>
            {/* End Call */}
            <TouchableOpacity
              style={[styles.endCallButton, {backgroundColor: '#f44336', width: endCallButtonSize, height: endCallButtonSize, borderRadius: endCallButtonSize / 2, justifyContent: 'center', alignItems: 'center'}]}
              onPress={handleEndCall}
            >
              <Text style={[styles.endCallButtonText, {fontSize: endCallButtonSize * 0.25}]}>✖️</Text>
              <Text style={[styles.endCallButtonText, {fontSize: 10}]}>End Call</Text>
            </TouchableOpacity>
            {/* Mute Headphones */}
            <TouchableOpacity
              style={[styles.muteButton, isHeadphonesMuted ? styles.muteButtonActive : null]}
              onPress={handleHeadphonesMute}
            >
              <Text style={{fontSize: 28}}>{isHeadphonesMuted ? '🔇' : '🔊'}</Text>
              <Text style={styles.muteButtonText}>{isHeadphonesMuted ? 'Sound Off' : 'Sound On'}</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>🎤 Voice communication active • Tap status to check connection</Text>
            <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>🎤 Tap microphone button to mute/unmute your voice</Text>
            <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>🔊 Tap sound button to mute/unmute incoming audio</Text>
            <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666', fontSize: fontSize}]}>🔄 Use voice status button if audio issues occur</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  mainContainer: {
    alignItems: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  duration: {
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
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
    width: '100%',
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
    marginBottom: 5,
  },
  role: {
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
    width: '100%',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 3,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  voiceStatusButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  endCallButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  endCallButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 'auto',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    width: '100%',
  },
  instructionsText: {
    textAlign: 'center',
    marginBottom: 3,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  muteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderWidth: 1,
    borderColor: 'transparent',
    
  },
  muteButtonActive: {
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  muteButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#fff',
  },
});

export default PrivateCallScreen; 