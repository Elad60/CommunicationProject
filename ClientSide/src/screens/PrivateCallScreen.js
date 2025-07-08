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

  // Generate unique channel name for private call
  const privateChannelName = `private_${Math.min(user.id, otherUser.id)}_${Math.max(user.id, otherUser.id)}`;

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

  // Start private call
  const startCall = async () => {
    try {
      console.log(`🔗 Starting private call with ${otherUser.username}`);
      console.log(`📞 Channel: ${privateChannelName}`);
      
      setIsConnecting(true);
      setCallStatus('Connecting...');
      
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
        
        await AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
        console.log('✅ Agora engine initialized');
        
        // Join the private channel
        console.log(`🎯 Joining private channel: ${privateChannelName}`);
        await AgoraModule.JoinChannel(privateChannelName);
        console.log('✅ JoinChannel method called');
        
        // Verify we joined the channel
        setTimeout(() => {
          AgoraModule.GetCurrentChannel((verifyChannel) => {
            console.log(`📊 Verification - joined channel: ${verifyChannel}`);
            if (verifyChannel === privateChannelName) {
              console.log('✅ VERIFIED: Successfully joined private channel');
            } else {
              console.log('⚠️ WARNING: Failed to join private channel or wrong channel!');
            }
          });
        }, 1000);
        
        setIsCallActive(true);
        setIsConnecting(false);
        setCallStatus('Connected');
        
        console.log('✅ Private call established successfully!');
        
        // Show success message only if not coming from accepted invitation
        if (!route.params?.isCallAccepted) {
          Alert.alert(
            'Call Started',
            `You are now in a private call with ${otherUser.username}!`,
            [{text: 'OK'}]
          );
        }
      } else {
        throw new Error('AgoraModule not available');
      }
    } catch (error) {
      console.error('❌ Error starting private call:', error);
      setIsConnecting(false);
      setCallStatus('Connection Failed');
      Alert.alert(
        'Call Failed',
        'Failed to start the call. Please try again.',
        [{text: 'OK', onPress: () => navigation.goBack()}]
      );
    }
  };

  // End private call
  const endCall = async () => {
    try {
      console.log('🔚 Ending private call...');
      console.log(`📞 Current channel: ${privateChannelName}`);
      
      if (AgoraModule) {
        // Check current channel before leaving
        AgoraModule.GetCurrentChannel((currentChannel) => {
          console.log(`📊 Current channel before leaving: ${currentChannel}`);
        });
        
        await AgoraModule.LeaveChannel();
        console.log('✅ Left private channel successfully');
        
        // Verify we left the channel
        setTimeout(() => {
          AgoraModule.GetCurrentChannel((currentChannel) => {
            console.log(`📊 Current channel after leaving: ${currentChannel}`);
            if (currentChannel === '' || currentChannel === null) {
              console.log('✅ VERIFIED: Successfully left channel');
            } else {
              console.log('⚠️ WARNING: Still in channel after leaving!');
            }
          });
        }, 500);
      }
      
      setIsCallActive(false);
      setCallStatus('Call Ended');
      
      // Navigate back with a small delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      // Even if there's an error, try to leave channel
      if (AgoraModule) {
        try {
          await AgoraModule.LeaveChannel();
          console.log('✅ Left channel during error handling');
        } catch (leaveError) {
          console.error('❌ Failed to leave channel during error handling:', leaveError);
        }
      }
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

  // Auto-start call when component mounts (only if call was accepted)
  useEffect(() => {
    if (route.params?.isCallAccepted) {
      console.log('✅ Call was accepted, starting private call...');
      startCall();
    } else {
      console.log('⚠️ Private call screen opened without accepted call');
      setCallStatus('Waiting for call acceptance...');
      setIsConnecting(false);
    }
  }, [route.params?.isCallAccepted]);

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
          style={[styles.debugButton, {backgroundColor: '#ff6600'}]}
          onPress={forceCloseAllChannels}>
          <Text style={styles.debugButtonText}>🚨 Force Close All Channels</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  debugButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PrivateCallScreen; 