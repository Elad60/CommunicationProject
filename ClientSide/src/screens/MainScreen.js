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

const {AgoraModule} = NativeModules;

const MainScreen = ({navigation}) => {
  console.log('MainScreen rendered');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Voice Communication State Management
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null); // Which channel is currently connected to voice
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false); // Is microphone active
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false); // Is Agora engine ready

  // Race condition prevention
  const [pendingMuteTimeout, setPendingMuteTimeout] = useState(null);
  const [pendingUnmuteTimeout, setPendingUnmuteTimeout] = useState(null);

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

    // AUTO-IDLE OTHER CHANNELS: If entering ListenOnly or ListenAndTalk, set all other channels to Idle
    let updatedChannels;
    if (nextState === 'ListenOnly' || nextState === 'ListenAndTalk') {
      console.log('🔄 Setting all other channels to Idle state...');
      updatedChannels = radioChannels.map(c => {
        if (c.id === channelId) {
          return {...c, channelState: nextState}; // Set current channel to new state
        } else if (c.channelState !== 'Idle') {
          console.log(`📭 Setting channel ${c.id} (${c.name}) to Idle`);
          return {...c, channelState: 'Idle'}; // Set all other channels to Idle
        } else {
          return c; // Keep already idle channels as they are
        }
      });
    } else {
      // If going to Idle, only update current channel
      updatedChannels = radioChannels.map(c =>
        c.id === channelId ? {...c, channelState: nextState} : c,
      );
    }

    setRadioChannels(updatedChannels);

    // ==================== VOICE INTEGRATION LOGIC ====================
    try {
      // RACE CONDITION FIX: Clear any pending audio timeouts first
      clearPendingAudioTimeouts();

      // Handle voice operations based on the new state
      switch (nextState) {
        case 'Idle':
          console.log('🔇 State: Idle - Leaving voice channel');
          await leaveVoiceChannel();
          break;

        case 'ListenOnly':
          console.log(
            '👂 State: ListenOnly - Joining channel and muting microphone',
          );
          if (activeVoiceChannel === channelId) {
            // Already in channel, immediately mute
            console.log(
              '🔇 Already in channel - immediately applying mute for ListenOnly',
            );
            AgoraModule.MuteLocalAudio(true);
            setIsMicrophoneEnabled(false);
          } else {
            // Join new channel
            const joinSuccessListen = await joinVoiceChannel(
              channelId,
              current.name,
            );
            if (joinSuccessListen) {
              // Schedule mute with timeout tracking
              console.log('⏳ Scheduling mute for ListenOnly mode...');
              const muteTimeout = setTimeout(async () => {
                console.log('🔇 APPLYING MUTE for ListenOnly mode...');
                AgoraModule.MuteLocalAudio(true);
                setIsMicrophoneEnabled(false);
                setPendingMuteTimeout(null);

                // Verify mute worked
                setTimeout(() => {
                  AgoraModule.IsLocalAudioMuted(isMuted => {
                    console.log(
                      `🔍 Mute verification: ${
                        isMuted ? 'SUCCESS ✅' : 'FAILED ❌'
                      }`,
                    );
                    if (!isMuted) {
                      console.log('🔄 Retrying mute...');
                      AgoraModule.MuteLocalAudio(true);
                    }
                  });
                }, 500);
              }, 1500);
              setPendingMuteTimeout(muteTimeout);

              console.log(
                '✅ Successfully joined in ListenOnly mode - mute scheduled',
              );
            }
          }
          break;

        case 'ListenAndTalk':
          console.log(
            '🎤 State: ListenAndTalk - Joining channel with microphone enabled',
          );
          if (activeVoiceChannel === channelId) {
            // Already in channel, immediately unmute
            console.log(
              '🔊 Already in channel - immediately enabling microphone for ListenAndTalk',
            );
            AgoraModule.MuteLocalAudio(false);
            setIsMicrophoneEnabled(true);
          } else {
            // Join new channel
            const joinSuccessTalk = await joinVoiceChannel(
              channelId,
              current.name,
            );
            if (joinSuccessTalk) {
              // Schedule unmute with timeout tracking
              console.log('⏳ Scheduling unmute for ListenAndTalk mode...');
              const unmuteTimeout = setTimeout(() => {
                console.log('🔊 ENSURING UNMUTE for ListenAndTalk mode...');
                AgoraModule.MuteLocalAudio(false);
                setIsMicrophoneEnabled(true);
                setPendingUnmuteTimeout(null);
              }, 1000);
              setPendingUnmuteTimeout(unmuteTimeout);

              console.log(
                '✅ Successfully joined in ListenAndTalk mode - unmute scheduled',
              );
            }
          }
          break;

        default:
          console.log('⚠️ Unknown channel state:', nextState);
      }

      // Update backend for all changed channels
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      // Update the main channel
      await radioChannelsApi.updateChannelState(userId, channelId, nextState);
      console.log(
        `✅ Channel ${channelId} successfully updated to ${nextState}`,
      );

      // Update other channels that were set to Idle (if any)
      if (nextState === 'ListenOnly' || nextState === 'ListenAndTalk') {
        const channelsToSetIdle = radioChannels.filter(
          c => c.id !== channelId && c.channelState !== 'Idle',
        );

        for (const channel of channelsToSetIdle) {
          try {
            await radioChannelsApi.updateChannelState(
              userId,
              channel.id,
              'Idle',
            );
            console.log(
              `✅ Channel ${channel.id} (${channel.name}) set to Idle in backend`,
            );
          } catch (error) {
            console.error(
              `❌ Failed to set channel ${channel.id} to Idle:`,
              error,
            );
          }
        }

        if (channelsToSetIdle.length > 0) {
          console.log(
            `✅ Successfully set ${channelsToSetIdle.length} other channels to Idle`,
          );
        }
      }
    } catch (error) {
      console.error('❌ Error updating channel state or voice:', error);

      // Revert ALL UI changes if operations failed (not just the main channel)
      console.log('🔄 Reverting all channel state changes due to error...');
      setRadioChannels(radioChannels); // Revert to original state before any changes

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

  // Clear any pending audio state timeouts to prevent race conditions
  const clearPendingAudioTimeouts = () => {
    if (pendingMuteTimeout) {
      console.log('🚫 Clearing pending mute timeout');
      clearTimeout(pendingMuteTimeout);
      setPendingMuteTimeout(null);
    }
    if (pendingUnmuteTimeout) {
      console.log('🚫 Clearing pending unmute timeout');
      clearTimeout(pendingUnmuteTimeout);
      setPendingUnmuteTimeout(null);
    }
  };

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

  // Join a voice channel for a specific radio channel (BACK TO SIMPLE VERSION)
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

      // BACK TO SIMPLE: Use regular JoinChannel that works
      AgoraModule.JoinChannel(agoraChannelName);

      setActiveVoiceChannel(channelId);
      setVoiceStatus('connected');
      console.log(`✅ Successfully joined voice channel: ${channelName}`);

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

      // Clear any pending audio timeouts when leaving
      clearPendingAudioTimeouts();

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
      clearPendingAudioTimeouts();
      setActiveVoiceChannel(null);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);
      return false;
    }
  };

  // Toggle microphone on/off (SIMPLIFIED VERSION)
  const toggleMicrophone = async enabled => {
    try {
      if (!activeVoiceChannel) {
        console.log(
          '⚠️ Cannot toggle microphone - not connected to voice channel',
        );
        return false;
      }

      console.log(`🎤 ${enabled ? 'Enabling' : 'Disabling'} microphone...`);

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

      // Clear any pending timeouts first
      clearPendingAudioTimeouts();

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

        {/* Emergency Voice Reset Button - Keep for production troubleshooting */}
        <TouchableOpacity
          style={styles.emergencyResetButton}
          onPress={emergencyVoiceReset}>
          <Text style={styles.testButtonText}>🚨 Reset</Text>
        </TouchableOpacity>
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
  emergencyResetButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MainScreen;
