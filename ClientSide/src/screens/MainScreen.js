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
import {useVoice} from '../context/VoiceContext';

const {AgoraModule} = NativeModules;

const MainScreen = ({navigation}) => {
  console.log('MainScreen rendered');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Voice Communication State Management
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false); // Is microphone active
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false); // Is Agora engine ready

  // Race condition prevention
  const [pendingMuteTimeout, setPendingMuteTimeout] = useState(null);
  const [pendingUnmuteTimeout, setPendingUnmuteTimeout] = useState(null);

  // Add per-channel UID tracking
  const [channelUids, setChannelUids] = useState({}); // { [agoraChannelName]: uid }

  const {user} = useAuth();
  const {
    showFrequency,
    showStatus,
    maxSimultaneousChannels,
    currentListeningChannels,
    currentTalkingChannel,
    addListeningChannel,
    removeListeningChannel,
    setTalkingChannel,
    clearTalkingChannel,
    switchTalkingChannel,
    getListeningCount,
    canAddMoreChannels,
    isChannelListening,
    isChannelTalking,
    getListeningChannels,
    clearAllChannels,
  } = useSettings();

  // Voice context for global voice management
  const {
    isVoiceInitialized,
    activeChannels,
    currentTalkingChannel: globalTalkingChannel,
    joinChannel,
    leaveChannel,
    setTalkingChannel: setGlobalTalkingChannel,
    muteChannel,
    getChannelUid,
    isChannelActive,
    isChannelTalking: isGlobalChannelTalking,
    getActiveChannelsCount,
  } = useVoice();

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

  // MainScreen is voice-enabled, so no cleanup needed
  useEffect(() => {
    console.log('🎬 MainScreen loaded - voice managed globally');
    // Voice is managed globally, no cleanup needed when leaving MainScreen
  }, []);

  // Handle selection of a radio channel
  const handleChannelSelect = id => {
    setSelectedChannel(id); // Set selected channel by id
  };

  // Multi-channel state handler with Voice Integration
  const handleChannelStateChange = async (channelId, direction = 'forward') => {
    const current = radioChannels.find(c => c.id === channelId);
    const newState =
      direction === 'forward'
        ? getNextState(current.channelState)
        : getPreviousState(current.channelState);

    try {
      clearPendingAudioTimeouts();

      // Handle multi-channel logic
      switch (newState) {
        case 'Idle':
          // Remove from listening channels
          removeListeningChannel(channelId);

          // If this was the talking channel, clear talking state
          if (currentTalkingChannel === channelId) {
            clearTalkingChannel();
          }

          // Leave voice channel using global voice context
          const channelUid = getChannelUid(channelId);
          if (channelUid) {
            await leaveChannel(channelId, channelUid);
          }

          // Update UI state
          setRadioChannels(prev =>
            prev.map(c =>
              c.id === channelId ? {...c, channelState: 'Idle'} : c,
            ),
          );
          break;

        case 'ListenOnly':
          // Check if we can add more channels
          if (!canAddMoreChannels() && !isChannelListening(channelId)) {
            // Check if max is already at 10
            if (maxSimultaneousChannels >= 10) {
              Alert.alert(
                'Maximum Channels Reached',
                'You have reached the maximum limit of 10 channels. You cannot listen to more channels.',
                [{text: 'OK'}],
              );
            } else {
              Alert.alert(
                'Channel Limit Reached',
                `You can only listen to ${maxSimultaneousChannels} channels at once. Would you like to increase the limit in settings?`,
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Go to Settings',
                    onPress: () => navigation.navigate('Settings'),
                  },
                ],
              );
            }
            return;
          }

          // Add to listening channels
          addListeningChannel(channelId);

          // Join voice channel using global voice context
          const newChannelUid = Math.floor(Math.random() * 1000000) + 1;
          await joinChannel(channelId, newChannelUid);

          // Update UI state - ONLY this channel, don't affect others
          setRadioChannels(prev =>
            prev.map(c =>
              c.id === channelId ? {...c, channelState: 'ListenOnly'} : c,
            ),
          );
          break;

        case 'ListenAndTalk':
          // Check if channel is in listening list
          if (!isChannelListening(channelId)) {
            Alert.alert(
              'Channel Not Listening',
              'You must be listening to a channel before you can talk on it.',
              [{text: 'OK'}],
            );
            return;
          }

          // Check if already talking on another channel
          if (currentTalkingChannel && currentTalkingChannel !== channelId) {
            Alert.alert(
              'Switch Talking Channel',
              'You can only talk on one channel at a time. Switch to this channel?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Switch',
                  onPress: () => switchTalkingChannelHandler(channelId),
                },
              ],
            );
            return;
          }

          // Set as talking channel
          setTalkingChannel(channelId);

          // Join voice channel if not already connected using global voice context
          if (!isChannelListening(channelId)) {
            const newChannelUid = Math.floor(Math.random() * 1000000) + 1;
            await joinChannel(channelId, newChannelUid);
          }

          // Set as talking channel using global voice context
          await setGlobalTalkingChannel(channelId);

          // Update UI state
          setRadioChannels(prev =>
            prev.map(c =>
              c.id === channelId ? {...c, channelState: 'ListenAndTalk'} : c,
            ),
          );
          break;
      }

      // Update backend
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      await radioChannelsApi.updateChannelState(userId, channelId, newState);
    } catch (error) {
      console.error('❌ Error updating channel state:', error);
      Alert.alert(
        'Connection Error',
        `Failed to ${
          newState === 'Idle' ? 'disconnect from' : 'connect to'
        } voice channel.`,
      );
    }
  };

  // Helper function to switch talking channel
  const switchTalkingChannelHandler = async newTalkingChannelId => {
    const currentChannel = radioChannels.find(
      c => c.id === newTalkingChannelId,
    );

    // Mute previous talking channel (set back to ListenOnly)
    if (currentTalkingChannel) {
      const currentTalkingChannelData = radioChannels.find(
        c => c.id === currentTalkingChannel,
      );
      if (currentTalkingChannelData) {
        setRadioChannels(prev =>
          prev.map(c =>
            c.id === currentTalkingChannel
              ? {...c, channelState: 'ListenOnly'}
              : c,
          ),
        );

        // Mute the previous talking channel
        const previousAgoraChannelName = `radio_channel_${currentTalkingChannel}`;
        const uid = channelUids[previousAgoraChannelName];
        if (uid) {
          AgoraModule.MuteChannel(previousAgoraChannelName, uid, true);
        }

        // Update backend
        const userId = user?.id;
        if (userId) {
          await radioChannelsApi.updateChannelState(
            userId,
            currentTalkingChannel,
            'ListenOnly',
          );
        }
      }
    }

    // Set new talking channel
    setTalkingChannel(newTalkingChannelId);

    // Update UI for new talking channel
    setRadioChannels(prev =>
      prev.map(c =>
        c.id === newTalkingChannelId
          ? {...c, channelState: 'ListenAndTalk'}
          : c,
      ),
    );

    // Update backend
    const userId = user?.id;
    if (userId) {
      await radioChannelsApi.updateChannelState(
        userId,
        newTalkingChannelId,
        'ListenAndTalk',
      );
    }

    // Join voice channel if needed using global voice context
    if (!isChannelListening(newTalkingChannelId)) {
      const newChannelUid = Math.floor(Math.random() * 1000000) + 1;
      await joinChannel(newTalkingChannelId, newChannelUid);
    }

    // Set as talking channel and unmute
    const newAgoraChannelName = `radio_channel_${newTalkingChannelId}`;
    const uid = channelUids[newAgoraChannelName];
    if (uid) {
      AgoraModule.SetTalkingChannel(newAgoraChannelName, uid);
      AgoraModule.MuteChannel(newAgoraChannelName, uid, false);
      setIsMicrophoneEnabled(true);
    }
  };

  // Wrapper functions for backwards compatibility
  const handleToggleChannelState = channelId =>
    handleChannelStateChange(channelId, 'forward');
  const handleReverseChannelState = channelId =>
    handleChannelStateChange(channelId, 'reverse');

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

  // Voice is now managed globally through VoiceContext
  // No local voice functions needed

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
                }}
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
                  isVoiceConnected={isChannelListening(channel.id)}
                  voiceStatus={
                    isChannelListening(channel.id)
                      ? voiceStatus
                      : 'disconnected'
                  }
                  isMicrophoneEnabled={isChannelTalking(channel.id)}
                  // Multi-channel props
                  isListening={isChannelListening(channel.id)}
                  isTalking={isChannelTalking(channel.id)}
                  listeningCount={getListeningCount()}
                  maxListeningChannels={maxSimultaneousChannels}
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
          onPress={() => {
            Alert.alert(
              'Voice Reset',
              'Voice is now managed globally. Please restart the app if needed.',
            );
          }}>
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
