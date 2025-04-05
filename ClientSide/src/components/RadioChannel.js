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
  const getBackgroundColor = () => {
    switch (channelState) {
      case 'ListenOnly':
        return '#1f3d1f'; // subtle green
      case 'ListenAndTalk':
        return '#1e2f4d'; // subtle blue
      case 'Idle':
      default:
        return '#222'; // default dark
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
    <View style={[styles.container, {backgroundColor: getBackgroundColor()}]}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.frequency}>{frequency}</Text>
      <Text style={styles.status}>{isActive ? 'Active' : 'Not used'}</Text>

      <View style={styles.iconContainer}>
        <Image source={headphones} style={styles.iconImage} />
        <View
          style={[
            styles.statusIndicator,
            {backgroundColor: isActive ? '#00cc00' : '#555'},
          ]}
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
    alignItems: 'center',
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
