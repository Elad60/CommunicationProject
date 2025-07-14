import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import ChannelParticipantsModal from '../components/ChannelParticipantsModal';
import {useAuth} from '../context/AuthContext';
import {radioChannelsApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';
import {useVoice} from '../context/VoiceContext';

const MainScreen = ({navigation}) => {
  console.log('MainScreen rendered');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get voice context
  const {
    activeVoiceChannel,
    voiceStatus,
    isMicrophoneEnabled,
    joinVoiceChannel,
    leaveVoiceChannel,
    clearPendingAudioTimeouts,
    setPendingMuteTimeout,
    setPendingUnmuteTimeout,
    emergencyVoiceReset,
  } = useVoice();

  // Modal state
  const [isParticipantsModalVisible, setIsParticipantsModalVisible] =
    useState(false);
  const [selectedChannelForModal, setSelectedChannelForModal] = useState(null);
  const [participantsForModal, setParticipantsForModal] = useState([]);

  const {user} = useAuth();
  const {showFrequency, showStatus, darkMode} = useSettings();

  // Hover state for Reset Voice button
  const [resetHovering, setResetHovering] = useState(false);

  // Colors for Reset Voice button (same as LogoutButton)
  const resetColors = {
    background: darkMode ? '#2a2a2a' : '#f8f9fa',
    backgroundHover: darkMode ? '#3a3a3a' : '#e9ecef',
    border: darkMode ? '#404040' : '#dee2e6',
    borderHover: darkMode ? '#555555' : '#adb5bd',
    text: darkMode ? '#e9ecef' : '#495057',
    textHover: darkMode ? '#ffffff' : '#212529',
    icon: darkMode ? '#dc3545' : '#dc3545',
    iconHover: darkMode ? '#c82333' : '#c82333',
  };

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
            // Channel is already connected, just mute
            // The VoiceContext handles the actual muting
          } else {
            // Join the channel and set to muted state
            const joinSuccess = await joinVoiceChannel(channelId, current.name);
            if (joinSuccess) {
              const muteTimeout = setTimeout(() => {
                // The VoiceContext will handle the actual muting
                setPendingMuteTimeout(null);
              }, 1500);
              setPendingMuteTimeout(muteTimeout);
            }
          }
          break;
        case 'ListenAndTalk':
          if (activeVoiceChannel === channelId) {
            // Channel is already connected, just unmute
            // The VoiceContext handles the actual unmuting
          } else {
            // Join the channel and set to unmuted state
            const joinSuccess = await joinVoiceChannel(channelId, current.name);
            if (joinSuccess) {
              const unmuteTimeout = setTimeout(() => {
                // The VoiceContext will handle the actual unmuting
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

  // Remove lastTapTime state
  // Remove handleChannelPress and double-tap logic
  const handleChannelLongPress = async channel => {
    try {
      const participants = await radioChannelsApi.getChannelParticipants(
        channel.id,
      );
      setParticipantsForModal(participants);
    } catch (err) {
      setParticipantsForModal([]);
    }
    setSelectedChannelForModal(channel);
    setIsParticipantsModalVisible(true);
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
              <View key={channel.id}>
                <TouchableOpacity
                  onPress={e => {
                    if (e && e.nativeEvent && e.nativeEvent.shiftKey) {
                      handleReverseChannelState(channel.id);
                    } else {
                      handleChannelSelect(channel.id);
                      handleToggleChannelState(channel.id);
                    }
                  }}
                  onLongPress={() => handleChannelLongPress(channel)}
                  style={{flex: 1}}>
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
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddChannel}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {/* Emergency Voice Reset Button - Styled exactly like LogoutButton */}
        <Pressable
          onPress={emergencyVoiceReset}
          onHoverIn={() => setResetHovering(true)}
          onHoverOut={() => setResetHovering(false)}
          style={[
            styles.resetVoiceButton,
            {
              backgroundColor: resetHovering
                ? resetColors.backgroundHover
                : resetColors.background,
              borderColor: resetHovering
                ? resetColors.borderHover
                : resetColors.border,
            },
          ]}>
          <View style={styles.resetVoiceContent}>
            <Image
              source={require('../../assets/logos/microphone.png')}
              style={[
                styles.resetVoiceIcon,
                {
                  tintColor: resetHovering
                    ? resetColors.iconHover
                    : resetColors.icon,
                },
              ]}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.resetVoiceText,
                {
                  color: resetHovering
                    ? resetColors.textHover
                    : resetColors.text,
                },
              ]}>
              Reset Voice
            </Text>
          </View>
        </Pressable>

        {/* Voice Status Indicator */}
      </View>

      {/* Channel Participants Modal */}
      <ChannelParticipantsModal
        visible={isParticipantsModalVisible}
        onClose={closeParticipantsModal}
        channelName={selectedChannelForModal?.name || ''}
        participants={participantsForModal}
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
  resetVoiceButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 1000,
  },
  resetVoiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetVoiceIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  resetVoiceText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default MainScreen;
