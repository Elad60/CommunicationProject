import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';

const RadioChannel = ({
  name,
  // frequency, // Removed
  isActive,
  mode,
  isSelected,
  channelState,
  numberOfChannels,
  // Voice connection props
  isVoiceConnected = false,
  voiceStatus = 'disconnected', // 'disconnected', 'connecting', 'connected'
  isMicrophoneEnabled = false,
}) => {
  // Access settings context values
  const {darkMode, showFrequency, showStatus} = useSettings();

  // Get screen dimensions with a 300ms debounce to avoid excessive renders
  const {height, width} = useDebouncedDimensions(300);

  // Return background color based on the channel's state
  const getBackgroundColor = () => {
    switch (channelState) {
      case 'ListenOnly':
        return darkMode ? '#1f3d1f' : '#99cc99'; // green shades
      case 'ListenAndTalk':
        return darkMode ? '#1e2f4d' : '#91aad4'; // blue shades
      case 'Idle':
      default:
        return darkMode ? '#222' : '#ddd'; // gray
    }
  };

  // Return proper icon paths for headphones and mic based on channel state
  const getIconPaths = () => {
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
    switch (voiceStatus) {
      case 'connected':
        return {
          backgroundColor: isMicrophoneEnabled ? '#ff6b35' : '#4CAF50', // Orange for talking, Green for listening
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
    if (!isVoiceConnected) return '';

    switch (voiceStatus) {
      case 'connected':
        return isMicrophoneEnabled ? '🎤 Talking' : '👂 Listening';
      case 'connecting':
        return '🔄 Connecting...';
      case 'disconnected':
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: getBackgroundColor()}]}>
      {/* Display room name */}
      <Text style={[styles.name, {color: darkMode ? '#fff' : '#000'}]}>
        {name}
      </Text>
      {/* Display mode as a badge */}
      {/* Voice status indicator (shows instead of frequency when voice connected) */}
      {isVoiceConnected ? (
        <Text style={[styles.voiceStatus, {color: darkMode ? '#fff' : '#000'}]}>
          {getVoiceStatusText()}
        </Text>
      ) : null}
      {/* Conditionally show status */}
      {showStatus && !isVoiceConnected && (
        <Text style={[styles.status, {color: darkMode ? '#fff' : '#000'}]}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      )}
      <View
        style={[
          styles.modeBadge,
          {backgroundColor: mode === 'Public' ? '#4CAF50' : '#607D8B'},
        ]}>
        <Text style={styles.modeBadgeText}>{mode}</Text>
      </View>
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
      {isVoiceConnected && (
        <View
          style={[
            styles.voiceConnectionBorder,
            {
              borderColor: isMicrophoneEnabled ? '#ff6b35' : '#4CAF50',
              borderWidth: voiceStatus === 'connected' ? 2 : 1,
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
    pointerEvents: 'none', // Allow touches to pass through
  },
  modeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default RadioChannel;
