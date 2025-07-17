import React, {createContext, useContext, useState, useEffect} from 'react';
import {NativeModules, Alert, DeviceEventEmitter} from 'react-native';

const {AgoraModule} = NativeModules;

// Add this if not already present:
if (!AgoraModule.removeListeners) {
  AgoraModule.removeListeners = () => {};
}

const VoiceContext = createContext();

export const VoiceProvider = ({children}) => {
  // Voice Communication State Management
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null); // Which channel is currently connected to voice
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false); // Is microphone active
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false); // Is Agora engine ready
 const [selectedChannel, setSelectedChannel] = useState(null);

  // Race condition prevention
  const [pendingMuteTimeout, setPendingMuteTimeout] = useState(null);
  const [pendingUnmuteTimeout, setPendingUnmuteTimeout] = useState(null);

  // Add event listeners for Agora events
  useEffect(() => {
    console.log('🎧 Setting up Agora event listeners...');

    // Listen for when a user joins the channel
    const onUserJoinedListener = DeviceEventEmitter.addListener('onUserJoined', (data) => {
      console.log('🔥 USER JOINED VOICE CHANNEL:', data);
      console.log('🎉 You should now be able to hear each other!');
      console.log('🎤 Both devices can now communicate!');
      console.log('📊 User data received:', JSON.stringify(data, null, 2));
      
      // Show user-friendly notification
      Alert.alert(
        'User Joined',
        `A user joined the voice channel (UID: ${data.uid}). You can now communicate!`,
        [{text: 'OK'}]
      );
    });

    // Listen for when a user leaves the channel
    const onUserOfflineListener = DeviceEventEmitter.addListener('onUserOffline', (data) => {
      console.log('😢 USER LEFT VOICE CHANNEL:', data);
      console.log('⚠️ Voice communication ended with this user');
      console.log('📊 User data received:', JSON.stringify(data, null, 2));
      
      // Show user-friendly notification
      Alert.alert(
        'User Left',
        `A user left the voice channel (UID: ${data.uid}).`,
        [{text: 'OK'}]
      );
    });

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up Agora event listeners...');
      onUserJoinedListener?.remove();
      onUserOfflineListener?.remove();
    };
  }, []); // Run once on mount

  // Initialize Agora engine when provider mounts
  useEffect(() => {
    const setupVoiceEngine = async () => {
      console.log('🎬 VoiceProvider loaded - initializing voice engine...');
      await initializeAgoraEngine();
    };

    setupVoiceEngine();

    // Cleanup function - leave voice channel when provider unmounts
    return () => {
      console.log('🧹 VoiceProvider unmounting - cleaning up voice...');
      try {
        if (AgoraModule) {
          AgoraModule.LeaveChannel();
        }
      } catch (error) {
        console.error('❌ Error during provider unmount cleanup:', error);
      }
    };
  }, []); // Run once on mount

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
  const joinVoiceChannel = async (
    channelId,
    channelName,
    initialState = 'ListenOnly',
  ) => {
    try {
      if (!isAgoraInitialized) {
        const initialized = await initializeAgoraEngine();
        if (!initialized) {
          throw new Error('Failed to initialize Agora engine');
        }
      }

      // If already connected to the same channel, just update microphone state
      if (activeVoiceChannel === channelId) {
        console.log('🔄 Already connected to channel, updating microphone state...');
        
        if (initialState === 'ListenOnly') {
          AgoraModule.MuteLocalAudio(true);
          setIsMicrophoneEnabled(false);
          console.log('🎤 Microphone muted (ListenOnly mode)');
        } else if (initialState === 'ListenAndTalk') {
          AgoraModule.MuteLocalAudio(false);
          setIsMicrophoneEnabled(true);
          console.log('🎤 Microphone enabled (ListenAndTalk mode)');
        }
        
        return true;
      }

      setVoiceStatus('connecting');

      // Leave current channel if connected to another
      if (activeVoiceChannel && activeVoiceChannel !== channelId) {
        console.log('🔄 Leaving current channel before joining new one...');
        AgoraModule.LeaveChannel();
        // Add small delay to ensure clean disconnect
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const agoraChannelName = `radio_channel_${channelId}`;
      console.log('🎤 Joining Agora channel:', agoraChannelName);
      
      AgoraModule.JoinChannel(agoraChannelName);

      setActiveVoiceChannel(channelId);
      setVoiceStatus('connected');

      // Set initial microphone state based on the channel state
      if (initialState === 'ListenOnly') {
        AgoraModule.MuteLocalAudio(true);
        setIsMicrophoneEnabled(false);
        console.log('🎤 Microphone muted on join (ListenOnly mode)');
      } else if (initialState === 'ListenAndTalk') {
        AgoraModule.MuteLocalAudio(false);
        setIsMicrophoneEnabled(true);
        console.log('🎤 Microphone enabled on join (ListenAndTalk mode)');
      }

      console.log('✅ Successfully joined voice channel:', agoraChannelName);
      console.log('👂 Ready to hear other users in the channel');
      console.log('🎤 Ready to transmit voice to other users');

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
        console.log('⚠️ No active voice channel to leave');
        return true;
      }

      console.log('🔄 Leaving voice channel:', activeVoiceChannel);
      clearPendingAudioTimeouts();
      setVoiceStatus('connecting');

      AgoraModule.LeaveChannel();

      setActiveVoiceChannel(null);
      setVoiceStatus('disconnected');
      setIsMicrophoneEnabled(false);
      
      console.log('✅ Successfully left voice channel');
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

  return (
    <VoiceContext.Provider
      value={{
        // State
        activeVoiceChannel,
        voiceStatus,
        isMicrophoneEnabled,
        isAgoraInitialized,
        pendingMuteTimeout,
        pendingUnmuteTimeout,
        selectedChannel,
        setSelectedChannel,
        // Actions
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMicrophone,
        clearPendingAudioTimeouts,
        handleVoiceError,
        cleanupVoiceConnection,
        emergencyVoiceReset,
        setPendingMuteTimeout,
        setPendingUnmuteTimeout,
        setIsMicrophoneEnabled,
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
