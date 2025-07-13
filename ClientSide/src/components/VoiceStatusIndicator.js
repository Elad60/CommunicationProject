import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useVoice} from '../context/VoiceContext';

const VoiceStatusIndicator = () => {
  const {activeVoiceChannel, voiceStatus, isMicrophoneEnabled} = useVoice();

  if (!activeVoiceChannel) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Voice: Disconnected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Voice: {voiceStatus} (Channel: {activeVoiceChannel})
      </Text>
      <Text style={styles.micText}>
        Mic: {isMicrophoneEnabled ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
    zIndex: 1000,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  micText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
});

export default VoiceStatusIndicator;
