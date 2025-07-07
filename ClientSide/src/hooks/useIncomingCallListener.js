import {useEffect, useRef} from 'react';
import {Alert, AppState} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {privateCallApi} from '../utils/apiService';

export const useIncomingCallListener = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user?.id) return;

    // Start listening for incoming calls
    startListening();

    // Listen for app state changes
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground, checking for missed calls');
        checkForIncomingCalls();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopListening();
      subscription?.remove();
    };
  }, [user?.id]);

  const startListening = () => {
    console.log('🔔 Starting incoming call listener...');
    
    // Check immediately
    checkForIncomingCalls();
    
    // Then check every 3 seconds
    intervalRef.current = setInterval(() => {
      checkForIncomingCalls();
    }, 3000);
  };

  const stopListening = () => {
    console.log('🔕 Stopping incoming call listener...');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkForIncomingCalls = async () => {
    try {
      // Try to check for real incoming calls
      const incomingCalls = await privateCallApi.checkIncomingCalls(user.id);
      
      if (incomingCalls && incomingCalls.length > 0) {
        // Handle the first incoming call
        const firstCall = incomingCalls[0];
        console.log('📞 Incoming call detected:', firstCall);
        
        // Stop listening while handling the call
        stopListening();
        
        // Navigate to incoming call screen
        navigation.navigate('IncomingCall', {
          invitation: {
            invitationId: firstCall.id,
            callerId: firstCall.callerId,
            callerName: firstCall.callerName,
            callerEmail: firstCall.callerEmail,
            callerRole: firstCall.callerRole,
            timestamp: firstCall.timestamp,
          },
        });
      }
    } catch (error) {
      // Only log the error, don't show to user
      if (error.response?.status === 404) {
        console.log('ℹ️ Incoming calls API endpoint not found (expected in development)');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('timeout')) {
        console.log('🌐 Network error checking for incoming calls (will retry)');
      } else {
        console.error('❌ Error checking for incoming calls:', error.message);
      }
      // Don't show error to user, just continue listening
    }
  };

  return {
    startListening,
    stopListening,
  };
}; 