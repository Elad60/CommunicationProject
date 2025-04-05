import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext'; // Assuming you have the context for darkMode

const RadioChannel = ({ name, frequency, isActive, mode, isSelected }) => {
  const { darkMode } = useSettings(); // Get darkMode from context

  // Determine background color based on isActive and darkMode
  const getBackgroundColor = () => {
    if (!isActive && darkMode) return '#222'; // If not active and darkMode is true, use #222
    if (!isActive && !darkMode) return '#ddd'; // If not active and darkMode is false, use #ddd
    if (isSelected) return '#555'; // If selected, use #555
    return mode === 'rx_tx' ? '#0a192f' : '#0a2f0a'; // Blue for Rx/Tx, Green for Rx Only
  };

  // Get text color based on darkMode state
  const getTextColor = () => {
    return darkMode ? '#fff' : '#000'; // White text for darkMode, black for light mode
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[styles.name, { color: getTextColor() }]}>{name}</Text>
      <Text style={[styles.frequency, { color: getTextColor() }]}>{frequency}</Text>
      <Text style={[styles.status, { color: getTextColor() }]}>{isActive ? 'Active' : 'Not used'}</Text>

      <View style={styles.iconContainer}>
        {/* Headphone icon */}
        <View style={styles.icon}>
          <Text style={styles.iconText}>🎧</Text>
        </View>

        {/* Transmit status */}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isActive ? '#f00' : '#333' },
          ]}
        />

        {/* Microphone icon */}
        <View style={styles.icon}>
          <Text style={styles.iconText}>🎤</Text>
        </View>
      </View>
    </View>
  );
};

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
  },
  icon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default RadioChannel;
