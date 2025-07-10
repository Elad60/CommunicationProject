import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import {useSettings} from '../context/SettingsContext';
import {privateCallApi} from '../utils/apiService';

const PrivateCallScreen = ({route, navigation}) => {
  const {otherUser, invitationId, currentUserId, channelName, isCaller, isCallAccepted} = route.params;
  const {darkMode} = useSettings();
  const [callDuration, setCallDuration] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const intervalRef = useRef(null);
  const statusCheckRef = useRef(null);
  
  console.log('🔵 PrivateCallScreen mounted with:', {
    otherUser: otherUser?.username,
    invitationId,
    currentUserId,
  });

  // Component lifecycle logging
  useEffect(() => {
    console.log('🎬 PrivateCallScreen MOUNTED');
    return () => {
      console.log('🏁 PrivateCallScreen UNMOUNTED - cleaning up all resources');
    };
  }, []);

  // Start call duration timer
  useEffect(() => {
    console.log('⏱️ Starting call duration timer...');
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Monitor call status - check if other user disconnected
  useEffect(() => {
    console.log('👁️ Starting call status monitoring...');
    
    let isMonitoring = true; // Flag to prevent multiple alerts
    let intervalId = null; // Store interval ID locally
    
    const checkCallStatus = async () => {
      console.log('🔍 checkCallStatus called, isMonitoring:', isMonitoring, 'isCallActive:', isCallActive);
      
      // Don't check if we're no longer monitoring
      if (!isMonitoring) {
        console.log('🛑 Stopping call status check - monitoring stopped');
        return;
      }
      
      // Don't check if call is not active
      if (!isCallActive) {
        console.log('🛑 Stopping call status check - call not active');
        return;
      }
      
      try {
        console.log('🔄 Polling for call status...');
        const response = await privateCallApi.getCallStatus(invitationId, currentUserId);
        
        if (response.success) {
          console.log('📊 Call status:', response.status);
          
          // If call was ended by the other user
          if (response.status === 'cancelled' || response.status === 'ended') {
            console.log('❌ Call ended by other user');
            
            // Stop monitoring IMMEDIATELY
            isMonitoring = false;
            setIsCallActive(false);
            
            // Clear the interval IMMEDIATELY
            if (intervalId) {
              console.log('🧹 Clearing local interval:', intervalId);
              clearInterval(intervalId);
              intervalId = null;
            }
            if (statusCheckRef.current) {
              console.log('🧹 Clearing ref interval:', statusCheckRef.current);
              clearInterval(statusCheckRef.current);
              statusCheckRef.current = null;
            }
            
            // Show notification and navigate back
            Alert.alert(
              'Call Ended',
              'The other user has ended the call.',
              [
                {
                  text: 'OK',
                                      onPress: () => {
                      console.log('📞 Other user ended call - returning to Groups (GlobalCallListener will resume polling)');
                      navigation.reset({index:0, routes:[{name:'Groups'}]});
                    },
                },
              ],
              { cancelable: false }
            );
            
            return; // Stop execution
          }
        }
      } catch (error) {
        console.error('❌ Error checking call status:', error);
        // Continue monitoring even if there's an error
      }
    };

    // Check immediately
    checkCallStatus();
    
    // Then check every 3 seconds
    intervalId = setInterval(checkCallStatus, 3000);
    statusCheckRef.current = intervalId;
    console.log('✅ Started polling with interval ID:', intervalId);

    return () => {
      console.log('🧹 Cleaning up call status monitoring, interval ID:', intervalId);
      isMonitoring = false; // Stop monitoring on cleanup
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = null;
      }
    };
  }, [invitationId, currentUserId, navigation]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle call end
  const handleEndCall = async () => {
    if (isEnding) return;
    
    console.log('🔴 Ending call...');
    setIsEnding(true);
    setIsCallActive(false);
    
    // Stop all timers IMMEDIATELY
    console.log('🛑 Stopping all timers...');
    if (intervalRef.current) {
      console.log('🧹 Clearing duration timer:', intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (statusCheckRef.current) {
      console.log('🧹 Clearing status check timer:', statusCheckRef.current);
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
    
    try {
      const response = await privateCallApi.endCall(invitationId, 'user_hangup');
      
      if (response.success) {
        console.log('✅ Call ended successfully');
      } else {
        console.error('❌ Failed to end call:', response.message);
      }
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
    
    // Always navigate back, even if API call fails
    console.log('📞 User ended call - returning to Groups (GlobalCallListener will resume polling)');
    navigation.reset({index:0, routes:[{name:'Groups'}]});
  };

  // Simulate call features (for testing)
  const handleTestFeature = (feature) => {
    console.log(`🧪 Testing feature: ${feature}`);
    Alert.alert(
      'Feature Test',
      `Testing ${feature} feature\n\nThis is a DATA-ONLY simulation.\nNo actual audio processing.`,
      [{text: 'OK'}]
    );
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#f0f0f0';
  const textColor = darkMode ? '#fff' : '#000';
  const cardColor = darkMode ? '#333' : '#fff';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>Private Call</Text>
        <Text style={[styles.duration, {color: textColor}]}>
          Duration: {formatDuration(callDuration)}
        </Text>
        <Text style={[styles.status, {color: '#4CAF50'}]}>
          {isCallActive ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* User Info */}
      <View style={[styles.userInfo, {backgroundColor: cardColor}]}>
        <View style={styles.userAvatar}>
          <Text style={[styles.avatarText, {color: '#fff'}]}>
            {otherUser.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <Text style={[styles.username, {color: textColor}]}>
          {otherUser.username}
        </Text>
        <Text style={[styles.userEmail, {color: darkMode ? '#ccc' : '#666'}]}>
          {otherUser.email}
        </Text>
        <Text style={[styles.role, {color: darkMode ? '#91aad4' : '#004080'}]}>
          You are the {isCaller ? 'Caller' : 'Receiver'}
        </Text>
      </View>

      {/* Call Info */}
      <View style={[styles.callInfo, {backgroundColor: cardColor}]}>
        <Text style={[styles.infoTitle, {color: textColor}]}>Call Information</Text>
        <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666'}]}>
          📡 Channel: {channelName}
        </Text>
        <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666'}]}>
          🆔 Invitation: {invitationId}
        </Text>
        <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666'}]}>
          🧪 Mode: DATA-ONLY Testing
        </Text>
        <Text style={[styles.infoText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔊 Audio: Simulated (No Agora)
        </Text>
      </View>

      {/* Test Controls */}
      <View style={styles.controlsContainer}>
        <Text style={[styles.controlsTitle, {color: textColor}]}>Test Controls</Text>
        
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, {backgroundColor: '#2196F3'}]}
            onPress={() => handleTestFeature('Mute')}
          >
            <Text style={styles.controlButtonText}>🎤 Mute Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, {backgroundColor: '#FF9800'}]}
            onPress={() => handleTestFeature('Speaker')}
          >
            <Text style={styles.controlButtonText}>🔊 Speaker Test</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, {backgroundColor: '#9C27B0'}]}
            onPress={() => handleTestFeature('Quality Check')}
          >
            <Text style={styles.controlButtonText}>📊 Quality Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, {backgroundColor: '#607D8B'}]}
            onPress={() => handleTestFeature('Network Info')}
          >
            <Text style={styles.controlButtonText}>🌐 Network Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* End Call Button */}
      <TouchableOpacity
        style={[styles.endCallButton, {backgroundColor: '#f44336'}]}
        onPress={handleEndCall}
      >
        <Text style={styles.endCallButtonText}>📞 End Call</Text>
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666'}]}>
          🧪 This is a DATA-ONLY testing environment
        </Text>
        <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666'}]}>
          📊 All audio features are simulated
        </Text>
        <Text style={[styles.instructionsText, {color: darkMode ? '#ccc' : '#666'}]}>
          🔄 Test buttons verify UI and data flow
        </Text>
      </View>
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
    marginBottom: 5,
  },
  duration: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
  },
  userInfo: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
  },
  callInfo: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 3,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    minWidth: 120,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  endCallButton: {
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  endCallButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 'auto',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  instructionsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default PrivateCallScreen; 