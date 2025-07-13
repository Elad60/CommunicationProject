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
  NativeEventEmitter,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import ChannelParticipantsModal from '../components/ChannelParticipantsModal';
import {useAuth} from '../context/AuthContext';
import {radioChannelsApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';

const {AgoraModule} = NativeModules;

// Add this if not already present:
if (!AgoraModule.removeListeners) {
  AgoraModule.removeListeners = () => {};
}

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

  // Modal state
  const [isParticipantsModalVisible, setIsParticipantsModalVisible] =
    useState(false);
  const [selectedChannelForModal, setSelectedChannelForModal] = useState(null);
  const [lastTapTime, setLastTapTime] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);

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

  useEffect(() => {
    const emitter = new NativeEventEmitter(AgoraModule);
    const joinSub = emitter.addListener('onUserJoined', event => {
      setConnectedUsers(prev => [...new Set([...prev, event.uid])]);
    });
    const leaveSub = emitter.addListener('onUserOffline', event => {
      setConnectedUsers(prev => prev.filter(uid => uid !== event.uid));
    });
    return () => {
      joinSub.remove();
      leaveSub.remove();
    };
  }, []);

  // Handle selection of a radio channel
  const handleChannelSelect = id => {
    setSelectedChannel(id); // Set selected channel by id
  };

  // Unified channel state handler with Voice Integration
  const handleChannelStateChange = async (channelId, direction = 'forward') => {
    const current = radioChannels.find(c => c.id === channelId);
    const newState =
      direction === 'forward'
        ? getNextState(current.channelState)
        : getPreviousState(current.channelState);

    // Update UI state
    const updatedChannels =
      newState === 'ListenOnly' || newState === 'ListenAndTalk'
        ? radioChannels.map(c =>
            c.id === channelId
              ? {...c, channelState: newState}
              : c.channelState !== 'Idle'
              ? {...c, channelState: 'Idle'}
              : c,
          )
        : radioChannels.map(c =>
            c.id === channelId ? {...c, channelState: newState} : c,
          );

    setRadioChannels(updatedChannels);

    try {
      clearPendingAudioTimeouts();

      // Handle voice operations
      switch (newState) {
        case 'Idle':
          await leaveVoiceChannel();
          break;
        case 'ListenOnly':
          if (activeVoiceChannel === channelId) {
            AgoraModule.MuteLocalAudio(true);
            setIsMicrophoneEnabled(false);
          } else {
            // Immediately set microphone state based on channel state
            setIsMicrophoneEnabled(false);
            const joinSuccess = await joinVoiceChannel(channelId, current.name);
            if (joinSuccess) {
              const muteTimeout = setTimeout(() => {
                AgoraModule.MuteLocalAudio(true);
                setIsMicrophoneEnabled(false);
                setPendingMuteTimeout(null);
              }, 1500);
              setPendingMuteTimeout(muteTimeout);
            }
          }
          break;
        case 'ListenAndTalk':
          if (activeVoiceChannel === channelId) {
            AgoraModule.MuteLocalAudio(false);
            setIsMicrophoneEnabled(true);
          } else {
            // Immediately set microphone state based on channel state
            setIsMicrophoneEnabled(true);
            const joinSuccess = await joinVoiceChannel(channelId, current.name);
            if (joinSuccess) {
              const unmuteTimeout = setTimeout(() => {
                AgoraModule.MuteLocalAudio(false);
                setIsMicrophoneEnabled(true);
                setPendingUnmuteTimeout(null);
              }, 1000);
              setPendingUnmuteTimeout(unmuteTimeout);
            }
          }
          break;
      }

      // Update backend
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      await radioChannelsApi.updateChannelState(userId, channelId, newState);

      // Set other channels to Idle if needed
      if (newState === 'ListenOnly' || newState === 'ListenAndTalk') {
        const channelsToSetIdle = radioChannels.filter(
          c => c.id !== channelId && c.channelState !== 'Idle',
        );

        await Promise.all(
          channelsToSetIdle.map(channel =>
            radioChannelsApi.updateChannelState(userId, channel.id, 'Idle'),
          ),
        );
      }
    } catch (error) {
      console.error('❌ Error updating channel state:', error);
      setRadioChannels(radioChannels);
      Alert.alert(
        'Connection Error',
        `Failed to ${
          newState === 'Idle' ? 'disconnect from' : 'connect to'
        } voice channel.`,
      );
    }
  };

  // Wrapper functions for backwards compatibility
  const handleToggleChannelState = channelId =>
    handleChannelStateChange(channelId, 'forward');
  const handleReverseChannelState = channelId =>
    handleChannelStateChange(channelId, 'reverse');

  // Double tap handler for opening participants modal
  const handleChannelPress = channel => {
    const now = Date.now();
    const lastTap = lastTapTime[channel.id] || 0;
    const DOUBLE_TAP_DELAY = 300; // 300ms for double tap

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - open participants modal
      setSelectedChannelForModal(channel);
      setIsParticipantsModalVisible(true);
      setLastTapTime({}); // Reset tap times
    } else {
      // Single tap - normal channel state change
      handleChannelSelect(channel.id);
      handleToggleChannelState(channel.id);
      setLastTapTime({...lastTapTime, [channel.id]: now});
    }
  };

  // Close participants modal
  const closeParticipantsModal = () => {
    setIsParticipantsModalVisible(false);
    setSelectedChannelForModal(null);
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

  // Helper function to get the previous state of a channel (reverse cycle)
  const getPreviousState = state => {
    switch (state) {
      case 'Idle':
        return 'ListenAndTalk';
      case 'ListenOnly':
        return 'Idle';
      case 'ListenAndTalk':
        return 'ListenOnly';
      default:
        return 'Idle';
    }
  };

  // Handle adding a new radio channel
  const handleAddChannel = () => {
    navigation.navigate('PickRadios');
  };

  // ==================== VOICE INTEGRATION HELPER FUNCTIONS ====================

  // Clear any pending audio state timeouts to prevent race conditions
  const clearPendingAudioTimeouts = () => {
    if (pendingMuteTimeout) {
      clearTimeout(pendingMuteTimeout);
      setPendingMuteTimeout(null);
    }
    if (pendingUnmuteTimeout) {
      clearTimeout(pendingUnmuteTimeout);
      setPendingUnmuteTimeout(null);
    }
  };

  // Initialize Agora engine (call once when app starts)
  const initializeAgoraEngine = async () => {
    try {
      if (!AgoraModule) {
        console.error('❌ AgoraModule not available');
        return false;
      }

      AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
      setIsAgoraInitialized(true);
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
      if (!isAgoraInitialized) {
        const initialized = await initializeAgoraEngine();
        if (!initialized) {
          throw new Error('Failed to initialize Agora engine');
        }
      }

      setVoiceStatus('connecting');

      // Leave current channel if connected to another
      if (activeVoiceChannel && activeVoiceChannel !== channelId) {
        AgoraModule.LeaveChannel();
      }

      const agoraChannelName = `radio_channel_${channelId}`;
      AgoraModule.JoinChannel(agoraChannelName);

      setActiveVoiceChannel(channelId);
      setVoiceStatus('connected');
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
      if (!activeVoiceChannel) return true;

      clearPendingAudioTimeouts();
      setVoiceStatus('connecting');

      AgoraModule.LeaveChannel();

      setActiveVoiceChannel(null);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);
      return true;
    } catch (error) {
      console.error('❌ Failed to leave voice channel:', error);
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
      clearPendingAudioTimeouts();

      if (activeVoiceChannel) {
        await leaveVoiceChannel();
      }

      setVoiceStatus('disconnected');
      setActiveVoiceChannel(null);
      setIsMicrophoneEnabled(false);
      setIsAgoraInitialized(false);
    } catch (error) {
      console.error('❌ Error during voice cleanup:', error);
    }
  };

  // Emergency reset function for when things go wrong
  const emergencyVoiceReset = async () => {
    try {
      Alert.alert('Voice Reset', 'Resetting voice connection...', [
        {text: 'OK'},
      ]);

      if (AgoraModule) {
        AgoraModule.LeaveChannel();
        AgoraModule.ReleaseEngine();
      }

      await cleanupVoiceConnection();

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
                onPress={() => handleChannelPress(channel)}
                onLongPress={() => {
                  // Long press for reverse state cycle
                  handleChannelSelect(channel.id);
                  handleReverseChannelState(channel.id);
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
                      ? channel.channelState === 'ListenAndTalk'
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

      {/* Channel Participants Modal */}
      <ChannelParticipantsModal
        visible={isParticipantsModalVisible}
        onClose={closeParticipantsModal}
        channelName={selectedChannelForModal?.name || ''}
        participants={connectedUsers.map(uid => ({
          username: `User ${uid}`,
          role: 'participant',
        }))}
      />
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
