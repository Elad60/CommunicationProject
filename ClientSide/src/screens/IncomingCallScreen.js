import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';

const IncomingCallScreen = ({route, navigation}) => {
  const {invitation} = route.params;
  const {user} = useAuth();
  const {darkMode} = useSettings();

  const [ringingTime, setRingingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Timer for ringing time
  useEffect(() => {
    const timer = setInterval(() => {
      setRingingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation for the incoming call indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  // Shake animation for the accept/reject buttons
  useEffect(() => {
    const shakeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    shakeAnimation.start();
    return () => shakeAnimation.stop();
  }, [shakeAnim]);

  // Vibration pattern
  useEffect(() => {
    const vibrationPattern = [0, 1000, 500, 1000, 500, 1000];
    Vibration.vibrate(vibrationPattern, true);
    
    return () => {
      Vibration.cancel();
    };
  }, []);

  // Handle back button (prevent going back during incoming call)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't allow back button during incoming call
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Auto-reject after 30 seconds
  useEffect(() => {
    const autoRejectTimer = setTimeout(() => {
      console.log('⏰ Auto-rejecting call after 30 seconds');
      handleRejectCall();
    }, 30000);

    return () => clearTimeout(autoRejectTimer);
  }, []);

  // Accept call
  const handleAcceptCall = async () => {
    try {
      console.log(`✅ Accepting call from ${invitation.callerName}`);
      Vibration.cancel();
      
      // Accept the invitation
      await privateCallApi.acceptCallInvitation(invitation.invitationId);
      
      // Navigate to private call screen
      navigation.replace('PrivateCall', {
        otherUser: {
          id: invitation.callerId,
          username: invitation.callerName,
          email: invitation.callerEmail,
          role: invitation.callerRole,
        },
        invitationId: invitation.invitationId,
        isCallAccepted: true,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      Alert.alert(
        'Error',
        'Failed to accept call. Please try again.',
        [{text: 'OK', onPress: handleRejectCall}]
      );
    }
  };

  // Reject call
  const handleRejectCall = async () => {
    try {
      console.log(`❌ Rejecting call from ${invitation.callerName}`);
      Vibration.cancel();
      
      // Reject the invitation
      await privateCallApi.rejectCallInvitation(invitation.invitationId);
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error rejecting call:', error);
      navigation.goBack();
    }
  };

  // Format ringing time
  const formatRingingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';
  const textColor = darkMode ? '#fff' : '#000';
  const cardColor = darkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>Incoming Call</Text>
        <Text style={[styles.ringingTime, {color: textColor}]}>
          {formatRingingTime(ringingTime)}
        </Text>
      </View>

      {/* Caller Info */}
      <View style={[styles.callerInfo, {backgroundColor: cardColor}]}>
        <Animated.View 
          style={[
            styles.callerAvatar,
            {
              transform: [{scale: pulseAnim}],
            },
          ]}
        >
          <Text style={[styles.avatarText, {color: '#fff'}]}>
            {invitation.callerName.charAt(0).toUpperCase()}
          </Text>
        </Animated.View>
        
        <Text style={[styles.callerName, {color: textColor}]}>
          {invitation.callerName}
        </Text>
        <Text style={[styles.callerEmail, {color: darkMode ? '#ccc' : '#666'}]}>
          {invitation.callerEmail}
        </Text>
        <Text style={[styles.callerRole, {color: darkMode ? '#91aad4' : '#004080'}]}>
          {invitation.callerRole}
        </Text>
      </View>

      {/* Incoming Call Animation */}
      <View style={styles.incomingContainer}>
        <View style={styles.incomingRings}>
          <Animated.View style={[styles.ring, styles.ring1, {transform: [{scale: pulseAnim}]}]} />
          <Animated.View style={[styles.ring, styles.ring2, {transform: [{scale: pulseAnim}]}]} />
          <Animated.View style={[styles.ring, styles.ring3, {transform: [{scale: pulseAnim}]}]} />
        </View>
        <Text style={[styles.incomingText, {color: textColor}]}>
          📞 {invitation.callerName} wants to start a private call
        </Text>
      </View>

      {/* Action Buttons */}
      <Animated.View 
        style={[
          styles.actionButtons,
          {
            transform: [{translateX: shakeAnim}],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleRejectCall}
        >
          <Text style={styles.actionButtonText}>❌</Text>
          <Text style={styles.actionButtonLabel}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAcceptCall}
        >
          <Text style={styles.actionButtonText}>✅</Text>
          <Text style={styles.actionButtonLabel}>Accept</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={[styles.quickActionsTitle, {color: textColor}]}>
          Quick Actions:
        </Text>
        <Text style={[styles.quickActionText, {color: darkMode ? '#ccc' : '#666'}]}>
          • Swipe up to accept
        </Text>
        <Text style={[styles.quickActionText, {color: darkMode ? '#ccc' : '#666'}]}>
          • Swipe down to reject
        </Text>
        <Text style={[styles.quickActionText, {color: darkMode ? '#ccc' : '#666'}]}>
          • Call will auto-reject in 30 seconds
        </Text>
      </View>

      {/* Auto-reject warning */}
      {ringingTime > 20 && (
        <View style={styles.warningContainer}>
          <Text style={[styles.warningText, {color: '#ff4444'}]}>
            ⚠️ Call will be rejected in {30 - ringingTime} seconds
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ringingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff6b35',
  },
  callerInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callerAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  callerEmail: {
    fontSize: 16,
    marginBottom: 10,
  },
  callerRole: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  incomingRings: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#ff6b35',
    opacity: 0.4,
  },
  ring1: {
    width: 100,
    height: 100,
  },
  ring2: {
    width: 140,
    height: 140,
  },
  ring3: {
    width: 180,
    height: 180,
  },
  incomingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  rejectButton: {
    backgroundColor: '#ff4444',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionButtonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    marginBottom: 5,
  },
  warningContainer: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default IncomingCallScreen; 