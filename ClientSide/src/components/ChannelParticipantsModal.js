import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
// Removed Fluent UI imports that are not used
// import {FluentProvider, Button, Text as FluentText, Card, Badge} from '@fluentui/react-native';
// import {useTheme} from '@fluentui/react-native';

const {width, height} = Dimensions.get('window');

const ChannelParticipantsModal = ({
  visible,
  onClose,
  channelName,
  participants = [],
}) => {
  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    modalContent: {
      backgroundColor: '#1a1a1a',
      borderRadius: 16,
      padding: 24,
      width: width * 0.9,
      maxHeight: height * 0.8,
      borderWidth: 1,
      borderColor: '#333',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: '#888',
    },
    channelInfo: {
      marginBottom: 20,
    },
    channelName: {
      fontSize: 20,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 8,
    },
    participantCount: {
      fontSize: 16,
      color: '#888',
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
      backgroundColor: '#2a2a2a',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#333',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#ffffff',
      marginBottom: 4,
    },
    participantRole: {
      fontSize: 14,
      color: '#888',
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#4a4a4a',
    },
    roleBadgeText: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: '#888',
      textAlign: 'center',
    },
  });

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'host':
        return '#4CAF50';
      case 'participant':
        return '#2196F3';
      default:
        return '#4a4a4a';
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
                  <Text style={styles.participantRole}>{participant.role}</Text>
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
