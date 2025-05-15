import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import {useSettings} from '../context/SettingsContext';
import { useDebouncedDimensions } from '../utils/useDebouncedDimensions';

const RadioChannel = ({
  name,
  frequency,
  isActive,
  mode,
  isSelected,
  channelState,
  numberOfChannels,
}) => {
  // Access settings context values
  const { darkMode, showFrequency, showStatus} = useSettings();

  // Get screen dimensions with a 300ms debounce to avoid excessive renders
  const { height, width } = useDebouncedDimensions(300);

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
  const { headphones, mic } = getIconPaths();

  
  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      {/* Display channel name */}
      <Text style={[styles.name, { color: darkMode ? '#fff' : '#000' }]}>{name}</Text>

      {/* Optionally show frequency and mode */}
      {showFrequency && (
        <Text style={[styles.frequency, { color: darkMode ? '#fff' : '#000' }]}>
          {frequency} {mode}
        </Text>
      )}

      {/* Optionally show usage status */}
      {showStatus && (
        <Text style={[styles.status, { color: darkMode ? '#fff' : '#000' }]}>
          {isActive ? 'Active' : 'Not used'}
        </Text>
      )}

      {/* Display icons + activity indicator */}
      <View style={styles.iconContainer}>
        <Image source={headphones} style={styles.iconImage} />
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isActive ? '#00cc00' : '#555' }, // Green if active
          ]}
        />
        <Image source={mic} style={styles.iconImage} />
      </View>
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
});

export default RadioChannel;
