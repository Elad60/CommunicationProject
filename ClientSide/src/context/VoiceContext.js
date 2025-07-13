import React, {createContext, useContext, useState, useEffect} from 'react';
import {NativeModules, Alert} from 'react-native';

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

  // Race condition prevention
  const [pendingMuteTimeout, setPendingMuteTimeout] = useState(null);
  const [pendingUnmuteTimeout, setPendingUnmuteTimeout] = useState(null);

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
