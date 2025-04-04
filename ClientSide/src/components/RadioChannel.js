import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

const RadioChannel = ({
  name,
  frequency,
  isActive,
  mode,
  isSelected,
  channelState,
}) => {
  const getCircleColor = () => {
    switch (channelState) {
      case 'Idle':
        return '#ffffff';
      case 'ListenOnly':
        return '#00cc00';
      case 'ListenAndTalk':
        return '#cc0000';
      default:
        return '#888';
    }
  };

  const getIconPaths = () => {
    switch (channelState) {
      case 'Idle':
        return {
          headphones: require('../../assets/logos/crossed-HF.png'),
          mic: require('../../assets/logos/crossed-mic.webp'),
        };
      case 'ListenOnly':
        return {
          headphones: require('../../assets/logos/headphones.png'),
          mic: require('../../assets/logos/crossed-mic.webp'),
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

  const {headphones, mic} = getIconPaths();

  return (
    <View style={[styles.container, {backgroundColor: '#222'}]}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.frequency}>{frequency}</Text>
      <Text style={styles.status}>{isActive ? 'Active' : 'Not used'}</Text>

      <View style={styles.iconContainer}>
        <Image source={headphones} style={styles.iconImage} />
        <View
          style={[styles.statusIndicator, {backgroundColor: getCircleColor()}]}
        />
        <Image source={mic} style={styles.iconImage} />
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
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default RadioChannel;
