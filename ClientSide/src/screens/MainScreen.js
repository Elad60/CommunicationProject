import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  NativeModules,
  Alert,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';
import {radioChannelsApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';

const {AgoraModule, TestModule} = NativeModules;

// Log available modules
console.log('Available Native Modules:', Object.keys(NativeModules));
console.log('AgoraModule:', AgoraModule);
console.log('TestModule:', TestModule);

const MainScreen = ({navigation}) => {
  console.log('MainScreen rendered');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleStatus, setModuleStatus] = useState('Not tested yet');

  // Voice Communication State Management
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null); // Which channel is currently connected to voice
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false); // Is microphone active
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false); // Is Agora engine ready

  const {user} = useAuth();
  const {showFrequency, showStatus} = useSettings();

  // Fetch radio channels for the authenticated user
  const fetchRadioChannels = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      const data = await radioChannelsApi.getUserChannels(userId);
      setRadioChannels(data); // Set the fetched radio channels
      setError(null); // Reset error state on successful fetch
    } catch (err) {
      console.error('Error fetching radio channels:', err);
      setError('Failed to load radio channels. Please try again later.'); // Set error message if fetch fails
    } finally {
      setIsLoading(false); // Set loading state to false once fetch is complete
    }
  };

  // Run fetchRadioChannels on component mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchRadioChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Initialize Agora engine when component mounts
  useEffect(() => {
    const setupVoiceEngine = async () => {
      console.log('🎬 MainScreen loaded - initializing voice engine...');
      await initializeAgoraEngine();
    };

    setupVoiceEngine();

    // Cleanup function - leave voice channel when component unmounts
    return () => {
      console.log('🧹 MainScreen unmounting - cleaning up voice...');
      try {
        if (AgoraModule) {
          AgoraModule.LeaveChannel();
        }
      } catch (error) {
        console.error('❌ Error during component unmount cleanup:', error);
      }
    };
  }, []); // Run once on mount

  // Handle selection of a radio channel
  const handleChannelSelect = id => {
    setSelectedChannel(id); // Set selected channel by id
  };

  // Handle toggle of radio channel state (Idle, ListenOnly, ListenAndTalk) with Voice Integration
  const handleToggleChannelState = async channelId => {
    const current = radioChannels.find(c => c.id === channelId);
    const nextState = getNextState(current.channelState); // Get the next state for the channel

    console.log(
      `🔄 Channel ${channelId} state change: ${current.channelState} → ${nextState}`,
    );

    // Update the UI state immediately for responsiveness
    const updatedChannels = radioChannels.map(c =>
      c.id === channelId ? {...c, channelState: nextState} : c,
    );
    setRadioChannels(updatedChannels);

    // ==================== VOICE INTEGRATION LOGIC ====================
    try {
      // Handle voice operations based on the new state
      switch (nextState) {
        case 'Idle':
          console.log('🔇 State: Idle - Leaving voice channel');
          await leaveVoiceChannel();
          break;

        case 'ListenOnly':
          console.log(
            '👂 State: ListenOnly - Joining channel, muting microphone',
          );
          const joinSuccess = await joinVoiceChannel(channelId, current.name);
          if (joinSuccess) {
            console.log(
              '🔇 CRITICAL: Calling toggleMicrophone(false) to MUTE user in ListenOnly mode',
            );
            await toggleMicrophone(false); // Mute microphone for listen-only
          }
          break;

        case 'ListenAndTalk':
          console.log('🎤 State: ListenAndTalk - Enabling microphone');
          if (activeVoiceChannel === channelId) {
            // Already in the channel, just enable microphone
            console.log(
              '🔊 CRITICAL: Calling toggleMicrophone(true) to UNMUTE user in ListenAndTalk mode',
            );
            await toggleMicrophone(true);
          } else {
            // Join channel and enable microphone
            const joinSuccess = await joinVoiceChannel(channelId, current.name);
            if (joinSuccess) {
              console.log(
                '🔊 CRITICAL: Calling toggleMicrophone(true) to UNMUTE user in ListenAndTalk mode',
              );
              await toggleMicrophone(true);
            }
          }
          break;

        default:
          console.log('⚠️ Unknown channel state:', nextState);
      }

      // Update backend only after voice operations succeed
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');
      await radioChannelsApi.updateChannelState(userId, channelId, nextState);

      console.log(
        `✅ Channel ${channelId} successfully updated to ${nextState}`,
      );
    } catch (error) {
      console.error('❌ Error updating channel state or voice:', error);

      // Revert UI state if operations failed
      const revertedChannels = radioChannels.map(c =>
        c.id === channelId ? {...c, channelState: current.channelState} : c,
      );
      setRadioChannels(revertedChannels);

      // Show user-friendly error
      Alert.alert(
        'Connection Error',
        `Failed to ${
          nextState === 'Idle' ? 'disconnect from' : 'connect to'
        } voice channel. Please try again.`,
      );
    }
  };

  // Helper function to get the next state of a channel
  const getNextState = state => {
    switch (state) {
      case 'Idle':
        return 'ListenOnly';
      case 'ListenOnly':
        return 'ListenAndTalk';
      case 'ListenAndTalk':
        return 'Idle';
      default:
        return 'Idle';
    }
  };

  // Handle adding a new radio channel
  const handleAddChannel = () => {
    navigation.navigate('PickRadios'); // Navigate to pick radios screen
    console.log('Add channel button pressed');
  };

  // ==================== VOICE INTEGRATION HELPER FUNCTIONS ====================

  // Initialize Agora engine (call once when app starts)
  const initializeAgoraEngine = async () => {
    try {
      console.log('🚀 Initializing Agora engine...');

      if (!AgoraModule) {
        console.error('❌ AgoraModule not available');
        return false;
      }

      AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
      setIsAgoraInitialized(true);
      console.log('✅ Agora engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Agora engine:', error);
      setIsAgoraInitialized(false);
      return false;
    }
  };

  // Join a voice channel for a specific radio channel
  const joinVoiceChannel = async (channelId, channelName) => {
    try {
      console.log(
        `🎤 Joining voice channel for: ${channelName} (ID: ${channelId})`,
      );

      if (!isAgoraInitialized) {
        console.log('🔧 Agora not initialized, initializing now...');
        const initialized = await initializeAgoraEngine();
        if (!initialized) {
          throw new Error('Failed to initialize Agora engine');
        }
      }

      setVoiceStatus('connecting');

      // Leave current channel if connected to another
      if (activeVoiceChannel && activeVoiceChannel !== channelId) {
        console.log(`🔄 Leaving current channel: ${activeVoiceChannel}`);
        AgoraModule.LeaveChannel();
      }

      // Create unique channel name for Agora
      const agoraChannelName = `radio_channel_${channelId}`;
      console.log(`📡 Joining Agora channel: ${agoraChannelName}`);

      AgoraModule.JoinChannel(agoraChannelName);

      setActiveVoiceChannel(channelId);
      setVoiceStatus('connected');
      console.log(`✅ Successfully joined voice channel: ${channelName}`);

      // Give Agora a moment to stabilize the connection before setting mute state
      setTimeout(() => {
        console.log('🔧 Channel joined, ready for microphone state control');
      }, 100);

      return true;
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      setVoiceStatus('disconnected');
      setActiveVoiceChannel(null);
      return false;
    }
  };

  // Leave current voice channel
  const leaveVoiceChannel = async () => {
    try {
      if (!activeVoiceChannel) {
        console.log('ℹ️ No active voice channel to leave');
        return true;
      }

      console.log(`👋 Leaving voice channel: ${activeVoiceChannel}`);
      setVoiceStatus('connecting'); // Show connecting status while leaving

      AgoraModule.LeaveChannel();

      setActiveVoiceChannel(null);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);
      console.log('✅ Successfully left voice channel');

      return true;
    } catch (error) {
      console.error('❌ Failed to leave voice channel:', error);
      // Still reset state even if leave failed
      setActiveVoiceChannel(null);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);
      return false;
    }
  };

  // Toggle microphone on/off
  const toggleMicrophone = async enabled => {
    try {
      if (!activeVoiceChannel) {
        console.log(
          '⚠️ Cannot toggle microphone - not connected to voice channel',
        );
        return false;
      }

      console.log(`🎤 ${enabled ? 'Enabling' : 'Disabling'} microphone...`);

      // Fixed: Use correct logic for muteLocalAudioStream
      // enabled=true (ListenAndTalk) -> mute=false (don't mute, allow talking)
      // enabled=false (ListenOnly) -> mute=true (mute microphone, only listen)
      AgoraModule.MuteLocalAudio(!enabled);
      setIsMicrophoneEnabled(enabled);

      console.log(
        `✅ Microphone ${enabled ? 'enabled (unmuted)' : 'disabled (muted)'}`,
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to toggle microphone:', error);
      return false;
    }
  };

  // ==================== ERROR HANDLING & CLEANUP FUNCTIONS ====================

  // Handle voice connection errors gracefully
  const handleVoiceError = (error, operation) => {
    console.error(`❌ Voice ${operation} failed:`, error);

    // Reset voice states on error
    setVoiceStatus('disconnected');
    setActiveVoiceChannel(null);
    setIsMicrophoneEnabled(false);

    // Show user-friendly error message
    const errorMessages = {
      join: 'Failed to join voice channel. Please check your connection and try again.',
      leave: 'Error leaving voice channel. Connection has been reset.',
      microphone: 'Failed to toggle microphone. Please try again.',
      initialize: 'Failed to initialize voice system. Please restart the app.',
    };

    Alert.alert(
      'Voice Connection Error',
      errorMessages[operation] || 'An unknown voice error occurred.',
    );
  };

  // Cleanup function for component unmount or app backgrounding
  const cleanupVoiceConnection = async () => {
    try {
      console.log('🧹 Cleaning up voice connections...');

      if (activeVoiceChannel) {
        await leaveVoiceChannel();
      }

      // Reset all voice states
      setVoiceStatus('disconnected');
      setActiveVoiceChannel(null);
      setIsMicrophoneEnabled(false);
      setIsAgoraInitialized(false);

      console.log('✅ Voice cleanup completed');
    } catch (error) {
      console.error('❌ Error during voice cleanup:', error);
    }
  };

  // Emergency reset function for when things go wrong
  const emergencyVoiceReset = async () => {
    try {
      console.log('🚨 Emergency voice reset initiated...');

      Alert.alert('Voice Reset', 'Resetting voice connection...', [
        {text: 'OK'},
      ]);

      // Force leave channel
      if (AgoraModule) {
        AgoraModule.LeaveChannel();
        AgoraModule.ReleaseEngine();
      }

      // Reset all states
      await cleanupVoiceConnection();

      // Reinitialize if possible
      setTimeout(async () => {
        await initializeAgoraEngine();
        Alert.alert(
          'Voice Reset',
          'Voice system has been reset. You can now try connecting again.',
        );
      }, 1000);
    } catch (error) {
      console.error('❌ Emergency reset failed:', error);
      Alert.alert('Reset Failed', 'Please restart the application.');
    }
  };

  // Test function to verify native module is working
  const testAgoraModule = () => {
    // Alert to confirm button press
    Alert.alert('Test Started', '🔍 TESTING NATIVE MODULES...');
    console.log('🔍 testAgoraModule called - starting test');

    // Check if module exists
    if (!NativeModules.AgoraModule) {
      console.error('❌ AgoraModule not found in NativeModules!');
      Alert.alert(
        'Critical Error',
        'AgoraModule not found in NativeModules. Available modules: ' +
          Object.keys(NativeModules).join(', '),
      );
      return;
    }

    let statusText = '';

    try {
      // Check TestModule first
      if (TestModule) {
        Alert.alert(
          'TestModule Status',
          '✅ TestModule is registered correctly!\n🔍 Calling TestModule.TestMethod()...',
        );
        TestModule.TestMethod();
        Alert.alert(
          'TestModule Success',
          '✅ TestModule.TestMethod() called successfully',
        );
        statusText += '✅ TestModule: WORKING\n';
      } else {
        Alert.alert('TestModule Error', '❌ TestModule is null or undefined');
        statusText += '❌ TestModule: NULL\n';
      }

      // Check AgoraModule
      if (!AgoraModule) {
        console.log('❌ AgoraModule is null or undefined');
        Alert.alert(
          'AgoraModule Error',
          '❌ AgoraModule is null or undefined - module not registered properly',
        );
        statusText += '❌ AgoraModule: NULL\n';
        setModuleStatus(statusText);
        return;
      }

      console.log('✅ AgoraModule found, calling InitializeAgoraEngine');
      Alert.alert(
        'AgoraModule Status',
        '✅ AgoraModule found!\n🔍 Calling AgoraModule.InitializeAgoraEngine()...',
      );
      statusText += '✅ AgoraModule: WORKING\n';

      // Test with the real App ID - now using proper C++ SDK
      console.log('🔧 About to call InitializeAgoraEngine with App ID');
      AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
      console.log('✅ InitializeAgoraEngine called successfully');
      Alert.alert(
        'AgoraModule Success',
        '✅ AgoraModule.InitializeAgoraEngine() called successfully',
      );
      statusText += '✅ Initialize: SUCCESS\n';

      // Test JoinChannel method
      Alert.alert('Channel Test', '🔍 Testing AgoraModule.JoinChannel()...');
      AgoraModule.JoinChannel('test-voice-channel');
      Alert.alert(
        'Channel Success',
        '✅ AgoraModule.JoinChannel() called successfully',
      );
      statusText += '✅ JoinChannel: SUCCESS\n';

      // Test LeaveChannel method (NEW)
      Alert.alert('Leave Test', '🔍 Testing AgoraModule.LeaveChannel()...');
      AgoraModule.LeaveChannel();
      Alert.alert(
        'Leave Success',
        '✅ AgoraModule.LeaveChannel() called successfully',
      );
      statusText += '✅ LeaveChannel: SUCCESS\n';

      // Skip ReleaseEngine to keep engine initialized for echo test
      // Alert.alert('Release Test', '🔍 Testing AgoraModule.ReleaseEngine()...');
      // AgoraModule.ReleaseEngine();
      // Alert.alert(
      //   'Release Success',
      //   '✅ AgoraModule.ReleaseEngine() called successfully',
      // );
      statusText += '✅ Engine: READY FOR ECHO TEST';

      Alert.alert(
        'Test Complete',
        '✅ VOICE COMMUNICATION CYCLE TESTED\n\n' + statusText,
      );

      setModuleStatus(statusText);
    } catch (error) {
      Alert.alert(
        'Test Error',
        `❌ Error testing Native Modules:\n${error.message}`,
      );
      statusText += `❌ ERROR: ${error.message}`;
      setModuleStatus(statusText);
    }
  };

  // Individual test functions for detailed debugging
  const testJoinChannel = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Join Test', '🔍 Testing JoinChannel only...');
      AgoraModule.JoinChannel('test-voice-channel');
      Alert.alert('Success', '✅ JoinChannel called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ JoinChannel failed: ${error.message}`);
    }
  };

  const testLeaveChannel = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Leave Test', '🔍 Testing LeaveChannel only...');
      AgoraModule.LeaveChannel();
      Alert.alert('Success', '✅ LeaveChannel called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ LeaveChannel failed: ${error.message}`);
    }
  };

  const testReleaseEngine = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Release Test', '🔍 Testing ReleaseEngine only...');
      AgoraModule.ReleaseEngine();
      Alert.alert('Success', '✅ ReleaseEngine called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ ReleaseEngine failed: ${error.message}`);
    }
  };

  // Debug function to check current mute status
  const checkMuteStatus = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }

      // Check if IsLocalAudioMuted method exists
      if (AgoraModule.IsLocalAudioMuted) {
        AgoraModule.IsLocalAudioMuted(isMuted => {
          Alert.alert(
            'Mute Status Debug',
            `🔍 Current Agora mute state: ${isMuted ? 'MUTED' : 'UNMUTED'}\n` +
              `🎯 App thinks microphone is: ${
                isMicrophoneEnabled ? 'ENABLED' : 'DISABLED'
              }\n` +
              `📡 Active voice channel: ${activeVoiceChannel || 'None'}\n` +
              `🔗 Voice status: ${voiceStatus}`,
          );
        });
      } else {
        Alert.alert(
          'Mute Status Debug',
          `🎯 App state only:\n` +
            `Microphone enabled: ${isMicrophoneEnabled ? 'YES' : 'NO'}\n` +
            `Active voice channel: ${activeVoiceChannel || 'None'}\n` +
            `Voice status: ${voiceStatus}\n\n` +
            `⚠️ IsLocalAudioMuted method not available in C++ module`,
        );
      }
    } catch (error) {
      Alert.alert('Error', `❌ Failed to check mute status: ${error.message}`);
    }
  };

  // Check function loading status
  const checkFunctionStatus = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }

      // Use callback pattern for React Native method
      AgoraModule.GetFunctionLoadingStatus(status => {
        Alert.alert('Function Loading Status', status);
      });
    } catch (error) {
      Alert.alert('Error', `❌ Failed to get status: ${error.message}`);
    }
  };

  // Echo test functions
  const startEchoTest = () => {
    try {
      console.log('🎤 startEchoTest called');
      if (!AgoraModule) {
        console.log('❌ AgoraModule not available in startEchoTest');
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      console.log('🔧 About to call StartEchoTest');
      Alert.alert(
        'Echo Test',
        '🎤 Starting echo test...\n\nSpeak into your microphone - you should hear your voice after 3 seconds!',
      );
      AgoraModule.StartEchoTest();
      console.log('✅ StartEchoTest called successfully');
    } catch (error) {
      console.log('❌ StartEchoTest error:', error.message);
      Alert.alert('Error', `❌ StartEchoTest failed: ${error.message}`);
    }
  };

  const stopEchoTest = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Echo Test', '🛑 Stopping echo test...');
      AgoraModule.StopEchoTest();
    } catch (error) {
      Alert.alert('Error', `❌ StopEchoTest failed: ${error.message}`);
    }
  };

  // Show loading indicator while data is being fetched
  if (isLoading) {
    return (
      <AppLayout navigation={navigation} title={user?.role}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      </AppLayout>
    );
  }

  // Show error message and retry button if fetching channels fails
  if (error) {
    return (
      <AppLayout navigation={navigation} title={user?.role}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRadioChannels()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  // Render the main content when data is successfully fetched
  return (
    <AppLayout navigation={navigation} title={user?.role}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.mainGrid}>
            {radioChannels.map(channel => (
              <TouchableOpacity
                key={channel.id}
                onPress={() => {
                  handleChannelSelect(channel.id);
                  handleToggleChannelState(channel.id);
                }}>
                <RadioChannel
                  name={channel.name}
                  frequency={channel.frequency}
                  isActive={channel.status === 'Active'}
                  mode={channel.mode}
                  isSelected={selectedChannel === channel.id}
                  channelState={channel.channelState}
                  showFrequency={showFrequency}
                  showStatus={showStatus}
                  numberOfChannels={radioChannels.length}
                  // Voice connection props
                  isVoiceConnected={activeVoiceChannel === channel.id}
                  voiceStatus={
                    activeVoiceChannel === channel.id
                      ? voiceStatus
                      : 'disconnected'
                  }
                  isMicrophoneEnabled={
                    activeVoiceChannel === channel.id
                      ? isMicrophoneEnabled
                      : false
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddChannel}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testAgoraModule}>
          <Text style={styles.testButtonText}>Test Agora</Text>
        </TouchableOpacity>

        {/* Individual test buttons for detailed testing */}
        <TouchableOpacity style={styles.joinButton} onPress={testJoinChannel}>
          <Text style={styles.testButtonText}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveButton} onPress={testLeaveChannel}>
          <Text style={styles.testButtonText}>Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.releaseButton}
          onPress={testReleaseEngine}>
          <Text style={styles.testButtonText}>Release</Text>
        </TouchableOpacity>

        {/* Function Status Check Button */}
        <TouchableOpacity
          style={styles.statusCheckButton}
          onPress={checkFunctionStatus}>
          <Text style={styles.testButtonText}>Status</Text>
        </TouchableOpacity>

        {/* Echo Test Buttons */}
        <TouchableOpacity
          style={styles.startEchoButton}
          onPress={startEchoTest}>
          <Text style={styles.testButtonText}>Start Echo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopEchoButton} onPress={stopEchoTest}>
          <Text style={styles.testButtonText}>Stop Echo</Text>
        </TouchableOpacity>

        {/* Emergency Voice Reset Button */}
        <TouchableOpacity
          style={styles.emergencyResetButton}
          onPress={emergencyVoiceReset}>
          <Text style={styles.testButtonText}>🚨 Reset</Text>
        </TouchableOpacity>

        {/* Debug Mute State Button */}
        <TouchableOpacity
          style={styles.debugMuteButton}
          onPress={checkMuteStatus}>
          <Text style={styles.testButtonText}>🔍 Mute?</Text>
        </TouchableOpacity>

        {/* Module Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Module Status:</Text>
          <Text style={styles.statusText}>{moduleStatus}</Text>
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#1DB954',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  testButton: {
    position: 'absolute',
    left: 20,
    bottom: 30,
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testText: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 100,
    color: '#333',
  },
  statusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  joinButton: {
    position: 'absolute',
    left: 20,
    bottom: 90,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  leaveButton: {
    position: 'absolute',
    left: 90,
    bottom: 90,
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  releaseButton: {
    position: 'absolute',
    left: 160,
    bottom: 90,
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  statusCheckButton: {
    position: 'absolute',
    left: 220,
    bottom: 90,
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  startEchoButton: {
    position: 'absolute',
    left: 20,
    bottom: 150,
    backgroundColor: '#9C27B0',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
  stopEchoButton: {
    position: 'absolute',
    left: 110,
    bottom: 150,
    backgroundColor: '#E91E63',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
  emergencyResetButton: {
    position: 'absolute',
    left: 200,
    bottom: 150,
    backgroundColor: '#D32F2F',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
  debugMuteButton: {
    position: 'absolute',
    left: 290,
    bottom: 150,
    backgroundColor: '#607D8B',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
});

export default MainScreen;
