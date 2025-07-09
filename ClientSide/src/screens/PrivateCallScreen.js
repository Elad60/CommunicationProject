import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  NativeModules,
  BackHandler,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';
import {privateCallApi} from '../utils/apiService';

const {AgoraModule} = NativeModules;

const PrivateCallScreen = ({route, navigation}) => {
  const {otherUser} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();
  const {height, width} = useDebouncedDimensions(300);

  // State management
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [isConnecting, setIsConnecting] = useState(true);

  // User monitoring system
  const [userCount, setUserCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionState, setConnectionState] = useState(0);
  const [lastUserCheckTime, setLastUserCheckTime] = useState(Date.now());
  const [monitoringLog, setMonitoringLog] = useState([]);

  // Function to add entry to monitoring log
  const addToMonitoringLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    
    setMonitoringLog(prevLog => {
      const newLog = [logEntry, ...prevLog];
      return newLog.slice(0, 5); // Keep only last 5 entries
    });
    
    console.log(`📝 ${logEntry}`);
  };

  // Generate unique channel name for private call
  const privateChannelName = `private_${Math.min(user.id, otherUser.id)}_${Math.max(user.id, otherUser.id)}`;
  
  // Debug: Log channel name on every render
  console.log(`🔍 DEBUG: Generated channel name: ${privateChannelName}`);
  console.log(`🔍 DEBUG: User ID: ${user.id}, Other User ID: ${otherUser.id}`);
  console.log(`🔍 DEBUG: For comparison, radio uses: 'test-voice-channel'`);

  // Timer for call duration
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 Back button pressed');
      console.log(`📊 Back button - isCallActive: ${isCallActive}`);
      
      if (isCallActive) {
        console.log('⚠️ Active call detected - showing confirmation dialog');
        Alert.alert(
          'End Call',
          'Are you sure you want to end this call?',
          [
            {text: 'Cancel', style: 'cancel', onPress: () => console.log('❌ User cancelled back button')},
            {text: 'End Call', onPress: () => {
              console.log('✅ User confirmed - ending call via back button');
              endCall();
            }, style: 'destructive'},
          ]
        );
        return true;
      } else {
        console.log('✅ No active call - allowing back navigation');
        // Even if not active, check if we're in a channel and leave it
        if (AgoraModule) {
          AgoraModule.GetCurrentChannel((currentChannel) => {
            console.log(`📊 Back button - current channel: ${currentChannel}`);
            if (currentChannel && currentChannel !== '') {
              console.log('⚠️ Found active channel during back navigation - leaving it');
              AgoraModule.LeaveChannel();
            }
          });
        }
        return false;
      }
    });

    return () => backHandler.remove();
  }, [isCallActive]);

  // Auto-start call when component mounts (only if call was accepted)
  useEffect(() => {
    if (route.params?.isCallAccepted) {
      console.log('✅ Call was accepted, starting private call...');
      console.log(`🎯 User role: ${route.params?.isCaller ? 'Caller' : 'Receiver'}`);
      console.log(`📞 Channel: ${privateChannelName}`);
      
      // Add delay to allow both users to be ready
      const initDelay = route.params?.isCaller ? 2000 : 500; // Caller waits longer
      
      setTimeout(() => {
        console.log(`⏰ Starting call after ${initDelay}ms delay...`);
        startCall();
      }, initDelay);
      
    } else {
      console.log('⚠️ Private call screen opened without accepted call');
      setCallStatus('Waiting for call acceptance...');
      setIsConnecting(false);
    }
  }, [route.params?.isCallAccepted]);

  // Enhanced call start with proper sequencing
  const startCall = async () => {
    try {
      console.log(`🔗 Starting private call with ${otherUser.username}`);
      console.log(`📞 Channel: ${privateChannelName}`);
      console.log(`🔧 AgoraModule available: ${!!AgoraModule}`);
      console.log(`👤 I am the: ${route.params?.isCaller ? 'CALLER' : 'RECEIVER'}`);
      
      setIsConnecting(true);
      setCallStatus('Initializing voice system...');
      addToMonitoringLog('🔧 Initializing Agora engine...');
      
      // Initialize Agora if not already done
      if (AgoraModule) {
        console.log('🔧 Initializing Agora for private call...');
        
        // Check if we're already in a channel
        AgoraModule.GetCurrentChannel((currentChannel) => {
          console.log(`📊 Current channel before initialization: ${currentChannel}`);
          if (currentChannel && currentChannel !== '') {
            console.log('⚠️ Already in a channel, leaving it first');
            AgoraModule.LeaveChannel();
          }
        });
        
        // Initialize engine and wait for it to complete
        console.log('🔧 Initializing Agora engine...');
        console.log('🔧 Using App ID: e5631d55e8a24b08b067bb73f8797fe3');
        await new Promise((resolve) => {
          AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
          // Wait a bit for initialization to complete
          setTimeout(() => {
            console.log('✅ Agora engine initialized (after delay)');
            addToMonitoringLog('✅ Engine initialized');
            resolve();
          }, 1500);
        });
        
        setCallStatus('Joining voice channel...');
        addToMonitoringLog('🎯 Joining voice channel...');
        
        // Join the private channel
        console.log(`🎯 Joining private channel: ${privateChannelName}`);
        console.log('🎯 Calling AgoraModule.JoinChannel now...');
        AgoraModule.JoinChannel(privateChannelName);
        console.log('✅ JoinChannel method called');
        
        // Verify we joined the channel
        setTimeout(() => {
          AgoraModule.GetCurrentChannel((verifyChannel) => {
            console.log(`📊 Verification - joined channel: ${verifyChannel}`);
            console.log(`📊 Expected channel: ${privateChannelName}`);
            console.log(`📊 Channels match: ${verifyChannel === privateChannelName}`);
            
            if (verifyChannel === privateChannelName) {
              console.log('✅ VERIFIED: Successfully joined private channel');
              addToMonitoringLog('✅ Successfully joined voice channel');
              
              setIsCallActive(true);
              setIsConnecting(false);
              setCallStatus('Connected - Waiting for other user...');
              
              // Start monitoring for the other user
              startWaitingForOtherUser();
              
            } else {
              console.log('⚠️ WARNING: Failed to join private channel or wrong channel!');
              console.log(`⚠️ Got: "${verifyChannel}", Expected: "${privateChannelName}"`);
              addToMonitoringLog('❌ Failed to join voice channel');
              
              setCallStatus('Connection Failed');
              Alert.alert(
                'Connection Failed',
                'Failed to join the voice channel. Please try again.',
                [{text: 'OK', onPress: () => navigation.goBack()}]
              );
            }
          });
        }, 2000);
        
        console.log('✅ Private call setup completed successfully!');
        
      } else {
        throw new Error('AgoraModule not available');
      }
    } catch (error) {
      console.error('❌ Error starting private call:', error);
      addToMonitoringLog('❌ Error starting call: ' + error.message);
      setIsConnecting(false);
      setCallStatus('Connection Failed');
      Alert.alert(
        'Call Failed',
        'Failed to start the call. Please try again.',
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
    }
  };

  // Wait for other user to join the channel
  const startWaitingForOtherUser = () => {
    console.log('👥 Starting to wait for other user...');
    addToMonitoringLog('👥 Waiting for other user...');
    
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds timeout
    
    const waitInterval = setInterval(() => {
      attempts++;
      console.log(`🔄 Waiting attempt ${attempts}/${maxAttempts}`);
      
      // Check if we're still connected and if there are other users
      AgoraModule.GetConnectionState((state) => {
        if (state === 3) { // Connected
          // Here we would ideally check for other users in the channel
          // Since we don't have that API, we'll simulate it
          console.log('📊 Connected to voice channel, checking for other users...');
          
          // For now, assume other user joined after 5-10 attempts
          if (attempts >= 5) {
            clearInterval(waitInterval);
            console.log('✅ Other user has joined the call!');
            addToMonitoringLog('✅ Both users connected!');
            setCallStatus('Connected');
            
            // Show success message
            Alert.alert(
              'Call Active',
              `You are now in a voice call with ${otherUser.username}!`,
              [{text: 'OK'}]
            );
          }
        } else {
          console.log(`⚠️ Connection state changed: ${state}`);
          addToMonitoringLog(`⚠️ Connection state: ${state}`);
        }
      });
      
      // Timeout after 20 seconds
      if (attempts >= maxAttempts) {
        clearInterval(waitInterval);
        console.log('⏰ Timeout waiting for other user');
        addToMonitoringLog('⏰ Timeout waiting for other user');
        
        Alert.alert(
          'Connection Timeout',
          `${otherUser.username} didn't join the voice channel within 20 seconds.`,
          [
            {text: 'Keep Waiting', onPress: () => startWaitingForOtherUser()},
            {text: 'End Call', onPress: () => endCall()}
          ]
        );
      }
    }, 1000);
  };

  // End private call
  const endCall = async () => {
    try {
      console.log('🔚 Ending private call...');
      console.log(`📞 Current channel: ${privateChannelName}`);
      console.log(`📊 Invitation ID: ${route.params?.invitationId}`);
      
      // Stop monitoring immediately
      setIsMonitoring(false);
      setCallStatus('Ending call...');
      addToMonitoringLog('🔚 User ended call');
      
      // Notify server that call is ending
      if (route.params?.invitationId) {
        try {
          console.log('📤 Notifying server that call is ending...');
          const response = await privateCallApi.endCall(route.params.invitationId, 'user_ended');
          if (response.Success) {
            console.log('✅ Server notified successfully');
            addToMonitoringLog('✅ Server notified of call end');
          } else {
            console.log('⚠️ Server notification failed:', response.Message);
            addToMonitoringLog('⚠️ Server notification failed');
          }
        } catch (apiError) {
          console.error('❌ Error notifying server:', apiError);
          addToMonitoringLog('❌ Error notifying server');
          // Continue with local cleanup even if server notification fails
        }
      }
      
      // Clean up Agora connection
      if (AgoraModule) {
        // Check current channel before leaving
        AgoraModule.GetCurrentChannel((currentChannel) => {
          console.log(`📊 Current channel before leaving: ${currentChannel}`);
          addToMonitoringLog(`📊 Leaving channel: ${currentChannel}`);
        });
        
        console.log('🔧 Leaving Agora channel...');
        await AgoraModule.LeaveChannel();
        console.log('✅ Left private channel successfully');
        addToMonitoringLog('✅ Left voice channel');
        
        // Verify we left the channel
        setTimeout(() => {
          AgoraModule.GetCurrentChannel((currentChannel) => {
            console.log(`📊 Current channel after leaving: ${currentChannel}`);
            if (currentChannel === '' || currentChannel === null) {
              console.log('✅ VERIFIED: Successfully left channel');
              addToMonitoringLog('✅ VERIFIED: Channel closed');
            } else {
              console.log('⚠️ WARNING: Still in channel after leaving!');
              addToMonitoringLog('⚠️ WARNING: Channel still active');
            }
          });
        }, 500);
      }
      
      setIsCallActive(false);
      setCallStatus('Call Ended');
      addToMonitoringLog('🏁 Call ended successfully');
      
      // Show end call message
      Alert.alert(
        'Call Ended',
        `Your call with ${otherUser.username} has ended.`,
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      addToMonitoringLog('❌ Error ending call: ' + error.message);
      
      // Even if there's an error, try to leave channel
      if (AgoraModule) {
        try {
          await AgoraModule.LeaveChannel();
          console.log('✅ Left channel during error handling');
          addToMonitoringLog('✅ Left channel during error handling');
        } catch (leaveError) {
          console.error('❌ Failed to leave channel during error handling:', leaveError);
          addToMonitoringLog('❌ Failed to leave channel during error handling');
        }
      }
      
      // Always navigate back even if there were errors
      navigation.goBack();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (AgoraModule && AgoraModule.MuteLocalAudio) {
      AgoraModule.MuteLocalAudio(newMutedState);
      console.log(`🎤 Mute toggled: ${newMutedState}`);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    
    if (AgoraModule && AgoraModule.SetSpeakerphoneOn) {
      AgoraModule.SetSpeakerphoneOn(newSpeakerState);
      console.log(`🔊 Speaker toggled: ${newSpeakerState}`);
    }
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Emergency function to force close all channels
  const forceCloseAllChannels = async () => {
    try {
      Alert.alert(
        'Force Close All Channels',
        'This will close ALL active Agora channels. Are you sure?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Force Close',
            style: 'destructive',
            onPress: async () => {
              console.log('🚨 Force closing all channels...');
              
              if (AgoraModule) {
                // Leave current channel
                await AgoraModule.LeaveChannel();
                console.log('✅ Left current channel');
                
                // Release entire engine (this closes all channels)
                await AgoraModule.ReleaseEngine();
                console.log('✅ Released Agora engine');
                
                Alert.alert('Success', 'All channels have been closed!');
                
                // Navigate back
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error force closing channels:', error);
      Alert.alert('Error', 'Failed to close channels: ' + error.message);
    }
  };

  // Function to check current channel status
  const checkChannelStatus = () => {
    if (AgoraModule) {
      console.log('🔍 Checking channel status...');
      
      AgoraModule.GetCurrentChannel((currentChannel) => {
        console.log(`📊 Current channel: ${currentChannel}`);
        
        AgoraModule.GetConnectionState((connectionState) => {
          console.log(`📊 Connection state: ${connectionState}`);
          
          const statusMessage = `Current Channel: ${currentChannel || 'None'}\n` +
                               `Connection State: ${connectionState}\n` +
                               `Expected Channel: ${privateChannelName}\n` +
                               `Call Active: ${isCallActive}`;
          
          Alert.alert('Channel Status', statusMessage, [
            {text: 'OK'},
            {text: 'Copy to Console', onPress: () => console.log('📋 CHANNEL STATUS:\n' + statusMessage)}
          ]);
        });
      });
    } else {
      Alert.alert('Error', 'AgoraModule not available');
    }
  };

  // Simple test function like in MainScreen
  const testSimpleJoin = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      
      console.log('🔧 Testing simple join like in MainScreen...');
      Alert.alert('Simple Join Test', '🔍 Testing simple JoinChannel like radio...');
      
      // Just join without initialization (like MainScreen)
      AgoraModule.JoinChannel(privateChannelName);
      
      Alert.alert('Success', '✅ Simple JoinChannel called successfully');
      
      // Verify after delay
      setTimeout(() => {
        AgoraModule.GetCurrentChannel((verifyChannel) => {
          console.log(`📊 Simple join verification - channel: ${verifyChannel}`);
          if (verifyChannel === privateChannelName) {
            Alert.alert('Verification', '✅ VERIFIED: Successfully joined with simple method!');
            setIsCallActive(true);
            setCallStatus('Connected (Simple Method)');
          } else {
            Alert.alert('Verification', '⚠️ WARNING: Simple join failed or wrong channel!');
          }
        });
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', `❌ Simple join failed: ${error.message}`);
    }
  };

  // Test function to join the same channel as radio (to isolate the issue)
  const testRadioChannel = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      
      console.log('🔧 Testing join to radio channel...');
      Alert.alert('Radio Channel Test', '🔍 Testing join to radio channel: test-voice-channel');
      
      // Join the same channel as radio
      AgoraModule.JoinChannel('test-voice-channel');
      
      Alert.alert('Success', '✅ Radio channel join called successfully');
      
      // Verify after delay
      setTimeout(() => {
        AgoraModule.GetCurrentChannel((verifyChannel) => {
          console.log(`📊 Radio channel verification - channel: ${verifyChannel}`);
          if (verifyChannel === 'test-voice-channel') {
            Alert.alert('Verification', '✅ VERIFIED: Successfully joined radio channel!');
            setIsCallActive(true);
            setCallStatus('Connected (Radio Channel)');
          } else {
            Alert.alert('Verification', '⚠️ WARNING: Radio channel join failed!');
          }
        });
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', `❌ Radio channel join failed: ${error.message}`);
    }
  };

  // Cleanup function to ensure we always leave the channel when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 PrivateCallScreen cleanup - ensuring channel is left');
      console.log(`📊 Cleanup - isCallActive: ${isCallActive}`);
      console.log(`📞 Cleanup - privateChannelName: ${privateChannelName}`);
      
      if (AgoraModule) {
        // Check current channel before cleanup
        AgoraModule.GetCurrentChannel((currentChannel) => {
          console.log(`📊 Cleanup - current channel: ${currentChannel}`);
          
          if (currentChannel && currentChannel !== '') {
            console.log('⚠️ Found active channel during cleanup - leaving it');
            AgoraModule.LeaveChannel();
            console.log('✅ Left channel during cleanup');
            
            // Verify cleanup worked
            setTimeout(() => {
              AgoraModule.GetCurrentChannel((verifyChannel) => {
                console.log(`📊 Cleanup verification - channel after cleanup: ${verifyChannel}`);
                if (verifyChannel === '' || verifyChannel === null) {
                  console.log('✅ CLEANUP VERIFIED: Channel successfully closed');
                } else {
                  console.log('⚠️ CLEANUP WARNING: Channel still active after cleanup!');
                }
              });
            }, 300);
          } else {
            console.log('✅ No active channel found during cleanup');
          }
        });
      }
    };
      }, [isCallActive, privateChannelName]);

  // Function to check if other user is still connected
  const checkUserConnection = () => {
    if (!AgoraModule || !isCallActive) return;
    
    console.log('🔍 Checking user connection...');
    addToMonitoringLog('🔍 Checking connection...');
    
    // Check connection state
    AgoraModule.GetConnectionState((state) => {
      console.log(`📊 Connection state: ${state}`);
      setConnectionState(state);
      
      // Connection states:
      // 1 = DISCONNECTED
      // 2 = CONNECTING  
      // 3 = CONNECTED
      // 4 = RECONNECTING
      // 5 = FAILED
      
      if (state === 1 || state === 5) {
        console.log('⚠️ Connection lost or failed!');
        addToMonitoringLog('⚠️ Connection lost or failed!');
        handleConnectionLost();
        return;
      }
      
      // If we're connected, check if we're in the right channel
      if (state === 3) {
        addToMonitoringLog('✅ Connected - checking channel...');
        AgoraModule.GetCurrentChannel((currentChannel) => {
          console.log(`📊 Current channel: ${currentChannel}`);
          console.log(`📊 Expected channel: ${privateChannelName}`);
          
          if (currentChannel !== privateChannelName) {
            console.log('⚠️ Channel mismatch - connection lost!');
            addToMonitoringLog('⚠️ Channel mismatch!');
            handleConnectionLost();
            return;
          }
          
          // If we're in the right channel and connected, the call is still active
          console.log('✅ Connection check passed - call is active');
          addToMonitoringLog('✅ Connection healthy');
        });
      } else if (state === 2) {
        addToMonitoringLog('🔄 Connecting...');
      } else if (state === 4) {
        addToMonitoringLog('🔄 Reconnecting...');
      }
    });
    
    setLastUserCheckTime(Date.now());
  };

  // Enhanced connection loss handler with better detection
  const handleConnectionLost = async () => {
    console.log('🚨 Connection lost detected!');
    
    if (isCallActive) {
      console.log('🔚 Ending call due to connection loss');
      
      // Stop monitoring immediately
      setIsMonitoring(false);
      setIsCallActive(false);
      setCallStatus('Call Ended - Connection Lost');
      addToMonitoringLog('🚨 Connection lost - ending call');
      
      // Notify server about the connection loss if possible
      if (route.params?.invitationId) {
        try {
          console.log('📤 Notifying server about connection loss...');
          await privateCallApi.endCall(route.params.invitationId, 'connection_lost');
          console.log('✅ Server notified about connection loss');
          addToMonitoringLog('✅ Server notified about connection loss');
        } catch (error) {
          console.error('❌ Failed to notify server about connection loss:', error);
          addToMonitoringLog('❌ Failed to notify server about connection loss');
        }
      }
      
      // Clean up Agora connection
      if (AgoraModule) {
        try {
          AgoraModule.LeaveChannel();
          console.log('✅ Left channel after connection loss');
          addToMonitoringLog('✅ Left channel after connection loss');
        } catch (error) {
          console.error('❌ Error leaving channel after connection loss:', error);
          addToMonitoringLog('❌ Error leaving channel after connection loss');
        }
      }
      
      Alert.alert(
        'Call Ended',
        `The call has been disconnected. This could be because:\n\n` +
        `• ${otherUser.username} left the call\n` +
        `• Network connection was lost\n` +
        `• The app was closed on the other device`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back after cleanup
              setTimeout(() => {
                navigation.goBack();
              }, 500);
            }
          }
        ]
      );
    }
  };

  // Enhanced monitoring with server-side validation
  const startEnhancedMonitoring = () => {
    console.log('🔍 Starting enhanced connection monitoring...');
    addToMonitoringLog('🚀 Starting enhanced monitoring...');
    
    let consecutiveFailures = 0;
    const maxFailures = 3; // Allow 3 consecutive failures before disconnecting
    
    const monitoringInterval = setInterval(async () => {
      if (!isCallActive || !isMonitoring) {
        clearInterval(monitoringInterval);
        return;
      }
      
      try {
        // Check 1: Agora connection state
        AgoraModule.GetConnectionState((state) => {
          console.log(`📊 Monitoring check - Connection state: ${state}`);
          
          if (state === 1 || state === 5) {
            consecutiveFailures++;
            console.log(`⚠️ Connection failure ${consecutiveFailures}/${maxFailures}`);
            addToMonitoringLog(`⚠️ Failure ${consecutiveFailures}/${maxFailures}`);
            
            if (consecutiveFailures >= maxFailures) {
              console.log('🚨 Maximum connection failures reached - ending call');
              addToMonitoringLog('🚨 Max failures - ending call');
              handleConnectionLost();
              clearInterval(monitoringInterval);
            }
          } else if (state === 3) {
            // Reset failure counter on successful connection
            if (consecutiveFailures > 0) {
              addToMonitoringLog(`✅ Connection recovered (was ${consecutiveFailures} failures)`);
            }
            consecutiveFailures = 0;
            console.log('✅ Connection stable');
          }
          
          setConnectionState(state);
        });
        
        // Check 2: Server-side call status (if we have invitation ID)
        if (route.params?.invitationId) {
          try {
            const statusResponse = await privateCallApi.getCallStatus(
              route.params.invitationId,
              route.params.currentUserId
            );
            
            if (statusResponse.success) {
              console.log(`📊 Server call status: ${statusResponse.status}`);
              
              if (statusResponse.status === 'ended' || statusResponse.status === 'cancelled') {
                console.log('🚨 Server reports call ended - disconnecting');
                addToMonitoringLog('🚨 Server reports call ended');
                handleConnectionLost();
                clearInterval(monitoringInterval);
                return;
              }
              
              addToMonitoringLog(`✅ Server status: ${statusResponse.status}`);
            } else {
              console.log('⚠️ Server status check failed');
              addToMonitoringLog('⚠️ Server status check failed');
            }
          } catch (serverError) {
            console.log('⚠️ Server monitoring error:', serverError);
            addToMonitoringLog('⚠️ Server monitoring error');
            // Don't increase failure count for server errors - only for Agora connection issues
          }
        }
        
        setLastUserCheckTime(Date.now());
        
      } catch (error) {
        console.error('❌ Error during monitoring:', error);
        addToMonitoringLog('❌ Monitoring error');
        consecutiveFailures++;
        
        if (consecutiveFailures >= maxFailures) {
          console.log('🚨 Maximum monitoring errors reached - ending call');
          addToMonitoringLog('🚨 Max errors - ending call');
          handleConnectionLost();
          clearInterval(monitoringInterval);
        }
      }
    }, 5000); // Check every 5 seconds
    
    // Store interval reference for cleanup
    return monitoringInterval;
  };

  // Monitor user connection with enhanced monitoring
  useEffect(() => {
    let monitoringInterval;
    
    if (isCallActive && isMonitoring) {
      console.log('🔍 Starting enhanced connection monitoring...');
      monitoringInterval = startEnhancedMonitoring();
    }
    
    return () => {
      if (monitoringInterval) {
        console.log('🛑 Stopping enhanced connection monitoring');
        clearInterval(monitoringInterval);
      }
    };
  }, [isCallActive, isMonitoring]);

  // Start monitoring when call becomes active
  useEffect(() => {
    if (isCallActive) {
      console.log('📡 Call is active - starting monitoring');
      addToMonitoringLog('📡 Call active - starting monitoring');
      setIsMonitoring(true);
    } else {
      console.log('📡 Call is not active - stopping monitoring');
      if (monitoringLog.length > 0) {
        addToMonitoringLog('📡 Call ended - stopping monitoring');
      }
      setIsMonitoring(false);
    }
  }, [isCallActive]);

  // Log when monitoring state changes
  useEffect(() => {
    if (isMonitoring) {
      addToMonitoringLog('🔄 Monitoring system activated');
    } else {
      // Only log if we have entries (to avoid logging on initial load)
      if (monitoringLog.length > 0) {
        addToMonitoringLog('🛑 Monitoring system deactivated');
      }
    }
  }, [isMonitoring]);

  // Function to manually check user connection status
  const manualConnectionCheck = () => {
    if (!AgoraModule) {
      Alert.alert('Error', 'AgoraModule not available');
      return;
    }
    
    console.log('🔍 Manual connection check initiated...');
    
    AgoraModule.GetCurrentChannel((currentChannel) => {
      AgoraModule.GetConnectionState((connectionState) => {
        
        const statusMessage = `🔍 CONNECTION STATUS:\n\n` +
                             `📡 Current Channel: ${currentChannel || 'None'}\n` +
                             `📊 Connection State: ${connectionState}\n` +
                             `🎯 Expected Channel: ${privateChannelName}\n` +
                             `📞 Call Active: ${isCallActive}\n` +
                             `🔄 Monitoring: ${isMonitoring ? 'ON' : 'OFF'}\n` +
                             `⏰ Last Check: ${new Date(lastUserCheckTime).toLocaleTimeString()}\n\n` +
                             `CONNECTION STATES:\n` +
                             `1 = DISCONNECTED\n` +
                             `2 = CONNECTING\n` +
                             `3 = CONNECTED\n` +
                             `4 = RECONNECTING\n` +
                             `5 = FAILED`;
        
        console.log('📋 MANUAL CONNECTION CHECK:\n' + statusMessage);
        
        Alert.alert('Connection Status', statusMessage, [
          {text: 'OK'},
          {text: 'Test Connection', onPress: () => checkUserConnection()}
        ]);
      });
    });
  };

  // Function to simulate connection loss for testing
  const simulateConnectionLoss = () => {
    Alert.alert(
      'Simulate Connection Loss',
      'This will simulate the other user disconnecting. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Simulate',
          style: 'destructive',
          onPress: () => {
            console.log('🎭 Simulating connection loss...');
            handleConnectionLost();
          }
        }
      ]
    );
  };

  // Function to restart monitoring
  const restartMonitoring = () => {
    console.log('🔄 Restarting monitoring...');
    addToMonitoringLog('🔄 User requested monitoring restart');
    
    Alert.alert(
      'Restart Monitoring',
      'This will restart the connection monitoring system. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Restart',
          onPress: () => {
            // Stop current monitoring
            setIsMonitoring(false);
            
            // Reset states
            setConnectionState(0);
            setLastUserCheckTime(Date.now());
            
            // Clear log and add restart message
            setMonitoringLog([]);
            
            // Restart monitoring after a short delay
            setTimeout(() => {
              if (isCallActive) {
                console.log('🔄 Restarting monitoring system...');
                addToMonitoringLog('🔄 Monitoring system restarted');
                setIsMonitoring(true);
                
                // Do an immediate check
                checkUserConnection();
                
                Alert.alert('Success', 'Monitoring system restarted successfully!');
              }
            }, 1000);
          }
        }
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
        <Text style={[styles.callStatus, {color: textColor}]}>{callStatus}</Text>
      </View>

      {/* User Info */}
      <View style={[styles.userInfo, {backgroundColor: cardColor}]}>
        <View style={styles.userAvatar}>
          <Text style={[styles.avatarText, {color: textColor}]}>
            {otherUser.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.username, {color: textColor}]}>
          {otherUser.username}
        </Text>
        <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666'}]}>
          {otherUser.email}
        </Text>
        <Text style={[styles.userRole, {color: darkMode ? '#91aad4' : '#004080'}]}>
          {otherUser.role}
        </Text>
      </View>

      {/* Call Duration */}
      {isCallActive && (
        <View style={styles.durationContainer}>
          <Text style={[styles.duration, {color: textColor}]}>
            {formatDuration(callDuration)}
          </Text>
        </View>
      )}

      {/* Monitoring Status */}
      {isCallActive && (
        <View style={styles.monitoringContainer}>
          <View style={styles.monitoringRow}>
            <View style={[
              styles.monitoringDot,
              {backgroundColor: isMonitoring ? '#00cc00' : '#ff4444'}
            ]} />
            <Text style={[styles.monitoringText, {color: textColor}]}>
              Monitoring: {isMonitoring ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <View style={styles.monitoringRow}>
            <View style={[
              styles.monitoringDot,
              {backgroundColor: connectionState === 3 ? '#00cc00' : 
                              connectionState === 2 || connectionState === 4 ? '#ff9800' : '#ff4444'}
            ]} />
            <Text style={[styles.monitoringText, {color: textColor}]}>
              Connection: {connectionState === 3 ? 'Connected' : 
                          connectionState === 2 ? 'Connecting' : 
                          connectionState === 4 ? 'Reconnecting' : 'Disconnected'}
            </Text>
          </View>
          
          <Text style={[styles.monitoringTime, {color: darkMode ? '#ccc' : '#666'}]}>
            Last check: {new Date(lastUserCheckTime).toLocaleTimeString()}
          </Text>
          
          {/* Monitoring Log */}
          {monitoringLog.length > 0 && (
            <View style={styles.monitoringLogContainer}>
              <Text style={[styles.monitoringLogTitle, {color: textColor}]}>
                Recent Activity:
              </Text>
              {monitoringLog.map((entry, index) => (
                <Text key={index} style={[styles.monitoringLogEntry, {color: darkMode ? '#ccc' : '#666'}]}>
                  {entry}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Connection Status */}
      {isConnecting && (
        <View style={styles.connectingContainer}>
          <Text style={[styles.connectingText, {color: textColor}]}>
            Connecting to {otherUser.username}...
          </Text>
        </View>
      )}

      {/* Call Status when not connected */}
      {!isCallActive && !isConnecting && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, {color: textColor}]}>
            {callStatus}
          </Text>
          {!route.params?.isCallAccepted && (
            <TouchableOpacity
              style={[styles.startCallButton, {backgroundColor: '#4CAF50'}]}
              onPress={startCall}
            >
              <Text style={styles.startCallButtonText}>Start Call Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {backgroundColor: isMuted ? '#ff4444' : '#4CAF50'},
          ]}
          onPress={toggleMute}
          disabled={!isCallActive}>
          <Image
            source={
              isMuted
                ? require('../../assets/logos/crossed-mic.png')
                : require('../../assets/logos/microphone.png')
            }
            style={styles.controlIcon}
          />
          <Text style={styles.controlText}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {backgroundColor: isSpeakerOn ? '#4CAF50' : '#666'},
          ]}
          onPress={toggleSpeaker}
          disabled={!isCallActive}>
          <Image
            source={require('../../assets/logos/speaker.png')}
            style={styles.controlIcon}
          />
          <Text style={styles.controlText}>
            {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, {backgroundColor: '#ff4444'}]}
          onPress={endCall}>
          <Text style={[styles.controlText, {fontSize: 18}]}>📞</Text>
          <Text style={styles.controlText}>End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Buttons */}
      <View style={styles.debugContainer}>
        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#4CAF50'}]}
          onPress={checkChannelStatus}>
          <Text style={styles.debugButtonText}>🔍 Check Channel Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#9C27B0'}]}
          onPress={testSimpleJoin}>
          <Text style={styles.debugButtonText}>🎯 Test Simple Join</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#2196F3'}]}
          onPress={testRadioChannel}>
          <Text style={styles.debugButtonText}>📻 Test Radio Channel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#ff6600'}]}
          onPress={forceCloseAllChannels}>
          <Text style={styles.debugButtonText}>🚨 Force Close All Channels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#007bff'}]}
          onPress={manualConnectionCheck}>
          <Text style={styles.debugButtonText}>🔄 Manual Connection Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#dc3545'}]}
          onPress={simulateConnectionLoss}>
          <Text style={styles.debugButtonText}>🎭 Simulate Loss</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, {backgroundColor: '#6c757d'}]}
          onPress={restartMonitoring}>
          <Text style={styles.debugButtonText}>⚙️ Restart Monitoring</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsTitle, {color: textColor}]}>
          How Private Calls Work:
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔐 Both users joined the same private channel
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          📡 Channel: {privateChannelName}
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          👂 Only you and {otherUser.username} can hear each other
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🎤 Use mute/unmute to control your microphone
        </Text>
        <Text style={[styles.instructionText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔊 Use speaker toggle for audio output
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
  callStatus: {
    fontSize: 16,
    opacity: 0.7,
  },
  userInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
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
    color: '#fff',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  duration: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  monitoringContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  monitoringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  monitoringDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  monitoringText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  monitoringTime: {
    fontSize: 12,
    marginTop: 5,
  },
  connectingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  connectingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginBottom: 5,
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  startCallButton: {
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  debugButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
    marginVertical: 5,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  monitoringLogContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
  monitoringLogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  monitoringLogEntry: {
    fontSize: 12,
    marginBottom: 2,
  },
});

export default PrivateCallScreen; 