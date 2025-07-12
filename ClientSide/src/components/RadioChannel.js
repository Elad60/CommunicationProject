import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';

const RadioChannel = ({
  name,
  frequency,
  isActive,
  mode,
  isSelected,
  channelState,
  numberOfChannels,
  // Voice connection props
  isVoiceConnected = false,
  voiceStatus = 'disconnected', // 'disconnected', 'connecting', 'connected'
  isMicrophoneEnabled = false,
  // Multi-channel props
  isListening = false,
  isTalking = false,
  listeningCount = 0,
  maxListeningChannels = 5,
}) => {
  // Access settings context values
  const {darkMode, showFrequency, showStatus} = useSettings();

  // Get screen dimensions with a 300ms debounce to avoid excessive renders
  const {height, width} = useDebouncedDimensions(300);

  // Return background color based on the channel's state
  const getBackgroundColor = () => {
    if (isTalking) {
      return darkMode ? '#2d4a2d' : '#4CAF50'; // Bright green for talking
    }

    switch (channelState) {
      case 'ListenOnly':
        return darkMode ? '#1f3d1f' : '#99cc99'; // green shades
      case 'ListenAndTalk':
        return darkMode ? '#1e2f4d' : '#91aad4'; // blue shades
      case 'Idle':
      default:
        return darkMode ? '#222' : '#ddd'; // default gray
    }
  };

  // Return icon paths based on channel state
  const getIconPaths = () => {
    if (isTalking) {
      return {
        headphones: require('../../assets/logos/headphones.png'),
        mic: require('../../assets/logos/microphone.png'),
      };
    }

    switch (channelState) {
      case 'Idle':
        return {
          headphones: require('../../assets/logos/crossed-HF.png'),
          mic: require('../../assets/logos/crossed-mic.png'),
        };
      case 'ListenOnly':
        return {
          headphones: require('../../assets/logos/headphones.png'),
          mic: require('../../assets/logos/crossed-mic.png'),
        };
      case 'ListenAndTalk':
        return {
          headphones: require('../../assets/logos/headphones.png'),
          mic: require('../../assets/logos/microphone.png'),
        };
      default:
        return {
          headphones: require('../../assets/logos/crossed-HF.png'),
          mic: require('../../assets/logos/microphone.png'),
        };
    }
  };

  // Destructure icon paths
  const {headphones, mic} = getIconPaths();

  // Get voice connection indicator color and style
  const getVoiceIndicatorStyle = () => {
    if (isTalking) {
      return {
        backgroundColor: '#ff6b35', // Orange for talking
        opacity: 1,
      };
    }

    if (isListening) {
      return {
        backgroundColor: '#4CAF50', // Green for listening
        opacity: 1,
      };
    }

    switch (voiceStatus) {
      case 'connected':
        return {
          backgroundColor: '#4CAF50', // Green for connected
          opacity: 1,
        };
      case 'connecting':
        return {
          backgroundColor: '#FFC107', // Yellow for connecting
          opacity: 0.7, // Pulsing effect will be added with animation
        };
      case 'disconnected':
      default:
        return {
          backgroundColor: '#555', // Gray for disconnected
          opacity: 1,
        };
    }
  };

  // Get voice status text for display
  const getVoiceStatusText = () => {
    if (isTalking) return '🎤 TALKING';
    if (isListening) return '👂 LISTENING';

    if (!isVoiceConnected) return '';

    switch (voiceStatus) {
      case 'connected':
        return '👂 Listening';
      case 'connecting':
        return '🔄 Connecting...';
      case 'disconnected':
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: getBackgroundColor()}]}>
      {/* Display channel name */}
      <Text style={[styles.name, {color: darkMode ? '#fff' : '#000'}]}>
        {name}
      </Text>

      {/* Voice status indicator (shows instead of frequency when voice connected) */}
      {isVoiceConnected || isListening || isTalking ? (
        <Text style={[styles.voiceStatus, {color: darkMode ? '#fff' : '#000'}]}>
          {getVoiceStatusText()}
        </Text>
      ) : (
        showFrequency && (
          <Text style={[styles.frequency, {color: darkMode ? '#fff' : '#000'}]}>
            {frequency} {mode}
          </Text>
        )
      )}

      {/* Multi-channel listening indicator */}
      {(isListening || isTalking) && (
        <View style={styles.listeningIndicator}>
          <Text
            style={[
              styles.listeningCount,
              {color: darkMode ? '#fff' : '#000'},
            ]}>
            {listeningCount}/{maxListeningChannels}
          </Text>
          {isTalking && (
            <Text
              style={[
                styles.talkingIndicator,
                {color: darkMode ? '#fff' : '#000'},
              ]}>
              🎤 TALKING
            </Text>
          )}
        </View>
      )}

      {/* Conditionally show status */}
      {showStatus && !isVoiceConnected && !isListening && !isTalking && (
        <Text style={[styles.status, {color: darkMode ? '#fff' : '#000'}]}>
          {isActive ? 'Active' : 'Not used'}
        </Text>
      )}

      {/* Display headphone and mic icons with voice connection indicator */}
      <View style={styles.iconContainer}>
        <Image source={headphones} style={styles.iconImage} />
        <View
          style={[
            styles.statusIndicator,
            getVoiceIndicatorStyle(),
            // Add pulsing animation for connecting state
            voiceStatus === 'connecting' && styles.pulsingIndicator,
          ]}
        />
        <Image source={mic} style={styles.iconImage} />
      </View>

      {/* Voice connection border indicator */}
      {(isVoiceConnected || isListening || isTalking) && (
        <View
          style={[
            styles.voiceConnectionBorder,
            {
              borderColor: isTalking ? '#ff6b35' : '#4CAF50',
              borderWidth: isListening || isTalking ? 2 : 1,
            },
          ]}
        />
      )}
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#444',
    padding: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  frequency: {
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    fontSize: 12,
    textAlign: 'center',
  },
  voiceStatus: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 2,
  },
  listeningIndicator: {
    alignItems: 'center',
    marginVertical: 2,
  },
  listeningCount: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  talkingIndicator: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    width: '100%',
    paddingHorizontal: 10,
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 5,
  },
  pulsingIndicator: {
    // Animation will be handled by React Native Animated API if needed
    opacity: 0.6,
  },
  voiceConnectionBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 5,
    borderWidth: 2,
  },
});

export default RadioChannel;
