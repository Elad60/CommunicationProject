import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const RadioChannel = ({ 
  name, 
  frequency, 
  isActive, 
  mode,
  isSelected
}) => {
  // Update getBackgroundColor
  const getBackgroundColor = () => {
    if (!isActive) return '#222';
    if (isSelected) return '#555';
    return mode === 'rx_tx' ? '#0a192f' : '#0a2f0a';
  };


  return (
    <View style={[styles.container, {backgroundColor: getBackgroundColor()}]}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.frequency}>{frequency}</Text>
      <Text style={styles.status}>{isActive ? 'Active' : 'Not used'}</Text>

      <View style={styles.iconContainer}>
        {/* Headphone icon */}
        <View style={styles.icon}>
          <Text style={styles.iconText}>🎧</Text>
        </View>

        {/* Transmit status */}
        <View
          style={[
            styles.statusIndicator,
            {backgroundColor: isActive ? '#f00' : '#333'},
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
    width: '16%',
    aspectRatio: 1,
    margin: '0.5%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#444',
    padding: 5,
    justifyContent: 'space-between',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  frequency: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    color: '#ddd',
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
