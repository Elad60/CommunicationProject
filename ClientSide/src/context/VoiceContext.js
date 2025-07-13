import React, {createContext, useContext, useState, useEffect} from 'react';
import {AppState} from 'react-native';
import {NativeModules} from 'react-native';

const {AgoraModule} = NativeModules;

// Create Context
const VoiceContext = createContext();

// Voice-enabled screens configuration
const VOICE_ENABLED_SCREENS = {
  Main: true,
  Settings: true,
  ChannelConfig: true,
  Groups: false, // Voice disabled for Groups
  Announcements: true,
  UserManagement: true,
  PickRadios: true,
};

// Provider Component
export const VoiceProvider = ({children}) => {
  const [isVoiceInitialized, setIsVoiceInitialized] = useState(false);
  const [activeChannels, setActiveChannels] = useState([]);
  const [currentTalkingChannel, setCurrentTalkingChannel] = useState(null);
  const [channelUids, setChannelUids] = useState({});
  const [voiceStatus, setVoiceStatus] = useState('disconnected');
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

  // Initialize Agora engine globally
  const initializeVoice = async () => {
    try {
      if (!AgoraModule) {
        console.error('❌ AgoraModule not available');
        return false;
      }

      if (isVoiceInitialized) {
        console.log('✅ Voice already initialized');
        return true;
      }

      console.log('🎬 Initializing global voice engine...');
      AgoraModule.InitializeAgoraEngine('e5631d55e8a24b08b067bb73f8797fe3');
      setIsVoiceInitialized(true);
      setVoiceStatus('connected');
      console.log('✅ Global voice engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize global voice engine:', error);
      setIsVoiceInitialized(false);
      return false;
    }
  };

  // Join a voice channel
  const joinChannel = async (channelId, uid) => {
    try {
      if (!isVoiceInitialized) {
        console.log('⚠️ Voice not initialized, initializing first...');
        await initializeVoice();
      }

      const agoraChannelName = `radio_channel_${channelId}`;
      console.log(`🎧 Joining channel: ${agoraChannelName} with UID: ${uid}`);

      AgoraModule.JoinChannelEx(agoraChannelName, uid);

      setActiveChannels(prev => {
        if (!prev.includes(channelId)) {
          return [...prev, channelId];
        }
        return prev;
      });

      setChannelUids(prev => ({...prev, [agoraChannelName]: uid}));
      setVoiceStatus('connected');

      console.log(`✅ Successfully joined channel: ${agoraChannelName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      return false;
    }
  };

  // Leave a voice channel
  const leaveChannel = async (channelId, uid) => {
    try {
      const agoraChannelName = `radio_channel_${channelId}`;
      console.log(`🎧 Leaving channel: ${agoraChannelName} with UID: ${uid}`);

      AgoraModule.LeaveChannelEx(agoraChannelName, uid);

      setActiveChannels(prev => prev.filter(id => id !== channelId));
      setChannelUids(prev => {
        const copy = {...prev};
        delete copy[agoraChannelName];
        return copy;
      });

      // If this was the talking channel, clear talking state
      if (currentTalkingChannel === channelId) {
        setCurrentTalkingChannel(null);
        setIsMicrophoneEnabled(false);
      }

      console.log(`✅ Successfully left channel: ${agoraChannelName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to leave channel:', error);
      return false;
    }
  };

  // Set talking channel
  const setTalkingChannel = async channelId => {
    try {
      const agoraChannelName = `radio_channel_${channelId}`;
      const uid = channelUids[agoraChannelName];

      if (!uid) {
        console.error('❌ No UID found for channel:', channelId);
        return false;
      }

      console.log(`🎤 Setting talking channel: ${agoraChannelName}`);
      AgoraModule.SetTalkingChannel(agoraChannelName, uid);
      AgoraModule.MuteChannel(agoraChannelName, uid, false); // Ensure unmuted for talking

      setCurrentTalkingChannel(channelId);
      setIsMicrophoneEnabled(true);

      console.log(`✅ Successfully set talking channel: ${agoraChannelName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to set talking channel:', error);
      return false;
    }
  };

  // Mute/Unmute channel
  const muteChannel = async (channelId, muted) => {
    try {
      const agoraChannelName = `radio_channel_${channelId}`;
      const uid = channelUids[agoraChannelName];

      if (!uid) {
        console.error('❌ No UID found for channel:', channelId);
        return false;
      }

      console.log(
        `🎤 ${muted ? 'Muting' : 'Unmuting'} channel: ${agoraChannelName}`,
      );
      AgoraModule.MuteChannel(agoraChannelName, uid, muted);

      // If muting and this was the talking channel, clear talking state
      if (muted && currentTalkingChannel === channelId) {
        setCurrentTalkingChannel(null);
        setIsMicrophoneEnabled(false);
        console.log(`🎤 Cleared talking state for muted channel: ${channelId}`);
      }

      console.log(
        `✅ Successfully ${
          muted ? 'muted' : 'unmuted'
        } channel: ${agoraChannelName}`,
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to mute/unmute channel:', error);
      return false;
    }
  };

  // Get channel UID
  const getChannelUid = channelId => {
    const agoraChannelName = `radio_channel_${channelId}`;
    return channelUids[agoraChannelName];
  };

  // Check if channel is active
  const isChannelActive = channelId => {
    return activeChannels.includes(channelId);
  };

  // Check if channel is talking
  const isChannelTalking = channelId => {
    return currentTalkingChannel === channelId;
  };

  // Get active channels count
  const getActiveChannelsCount = () => {
    return activeChannels.length;
  };

  // Cleanup voice when app closes
  const cleanupVoice = async () => {
    try {
      console.log('🧹 Cleaning up global voice...');

      if (AgoraModule) {
        // Leave all connected channels
        activeChannels.forEach(channelId => {
          const agoraChannelName = `radio_channel_${channelId}`;
          const uid = channelUids[agoraChannelName];
          if (uid) {
            AgoraModule.LeaveChannelEx(agoraChannelName, uid);
          }
        });

        AgoraModule.ReleaseEngine();
      }

      setActiveChannels([]);
      setCurrentTalkingChannel(null);
      setChannelUids({});
      setIsVoiceInitialized(false);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);

      console.log('✅ Global voice cleanup completed');
    } catch (error) {
      console.error('❌ Error during global voice cleanup:', error);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background') {
        console.log('📱 App going to background - keeping voice active');
        // Keep voice active in background
        // Maybe reduce audio quality to save battery in the future
      } else if (nextAppState === 'active') {
        console.log('📱 App coming to foreground - restoring voice');
        // Restore full voice functionality
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // Initialize voice when provider mounts
  useEffect(() => {
    initializeVoice();

    // Cleanup when provider unmounts (app closes)
    return () => {
      cleanupVoice();
    };
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        // State
        isVoiceInitialized,
        activeChannels,
        currentTalkingChannel,
        channelUids,
        voiceStatus,
        isMicrophoneEnabled,

        // Methods
        initializeVoice,
        joinChannel,
        leaveChannel,
        setTalkingChannel,
        muteChannel,
        getChannelUid,
        isChannelActive,
        isChannelTalking,
        getActiveChannelsCount,
        cleanupVoice,

        // Configuration
        VOICE_ENABLED_SCREENS,
      }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
