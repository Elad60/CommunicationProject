import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';

const getStyles = (darkMode, width, height) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    modalContent: {
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      borderRadius: 16,
      padding: 24,
      width: width * 0.9,
      maxHeight: height * 0.8,
      borderWidth: 1,
      borderColor: darkMode ? '#333' : '#ccc',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? '#333' : '#eee',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#222',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: darkMode ? '#888' : '#aaa',
    },
    channelInfo: {
      marginBottom: 20,
    },
    channelName: {
      fontSize: 20,
      fontWeight: '600',
      color: darkMode ? '#fff' : '#222',
      marginBottom: 8,
    },
    participantCount: {
      fontSize: 16,
      color: darkMode ? '#aaa' : '#666',
    },
    participantsList: {
      maxHeight: height * 0.5,
    },
    participantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 4,
      backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: darkMode ? '#333' : '#ddd',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '500',
      color: darkMode ? '#fff' : '#222',
      marginBottom: 4,
    },
    participantRole: {
      fontSize: 14,
      color: darkMode ? '#aaa' : '#666',
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: darkMode ? '#4a4a4a' : '#e0e0e0',
    },
    roleBadgeText: {
      fontSize: 12,
      color: darkMode ? '#fff' : '#333',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: darkMode ? '#888' : '#aaa',
      textAlign: 'center',
    },
  });

const ChannelParticipantsModal = ({
  visible,
  onClose,
  channelName,
  participants = [],
}) => {
  const {darkMode} = useSettings();
  const {width, height} = useDebouncedDimensions(300);
  const styles = getStyles(darkMode, width, height);

  if (!visible) return null;

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'host':
        return darkMode ? '#4CAF50' : '#388e3c';
      case 'participant':
        return darkMode ? '#2196F3' : '#1976d2';
      default:
        return darkMode ? '#4a4a4a' : '#e0e0e0';
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Channel Participants</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Info */}
        <View style={styles.channelInfo}>
          <Text style={styles.channelName}>{channelName}</Text>
          <Text style={styles.participantCount}>
            {participants.length} participant
            {participants.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Participants List */}
        <ScrollView style={styles.participantsList}>
          {participants.length > 0 ? (
            participants.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.username}
                  </Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    {backgroundColor: getRoleBadgeColor(participant.role)},
                  ]}>
                  <Text style={styles.roleBadgeText}>
                    {participant.role.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No participants in this channel yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default ChannelParticipantsModal;
