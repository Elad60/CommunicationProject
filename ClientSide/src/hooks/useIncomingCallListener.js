import {useState, useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {privateCallApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';

const useIncomingCallListener = (navigation) => {
  const {user} = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Start listening for incoming calls
  const startListening = () => {
    if (!user?.id || isListening) return;
    
    console.log('🔔 Starting to listen for incoming calls...');
    setIsListening(true);
    
    // Check immediately
    checkForIncomingCalls();
    
    // Then check every 3 seconds
    intervalRef.current = setInterval(() => {
      checkForIncomingCalls();
    }, 3000);
  };

  // Stop listening for incoming calls
  const stopListening = () => {
    console.log('🔕 Stopping incoming call listener...');
    setIsListening(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Check for incoming calls
  const checkForIncomingCalls = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Checking for incoming calls...');
      const response = await privateCallApi.getIncomingCalls(user.id);
      
      if (response.Success && response.IncomingCalls && response.IncomingCalls.length > 0) {
        const latestCall = response.IncomingCalls[0]; // Get the most recent call
        console.log('📞 Found incoming call:', latestCall);
        
        // Check if this is a new call (different from current incoming call)
        if (!incomingCall || latestCall.Id !== incomingCall.Id) {
          console.log('🆕 New incoming call detected!');
          setIncomingCall(latestCall);
          
          // Navigate to incoming call screen
          navigation.navigate('IncomingCall', {
            callInvitation: latestCall,
          });
          
          // Stop listening while handling the call
          stopListening();
        }
      } else {
        // No incoming calls
        console.log('📭 No incoming calls found');
        
        // If we had an incoming call before, clear it
        if (incomingCall) {
          console.log('🧹 Clearing previous incoming call');
          setIncomingCall(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for incoming calls:', error);
      // Don't stop listening on error - might be temporary network issue
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log(`📱 App state changed: ${appStateRef.current} -> ${nextAppState}`);
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume listening
        console.log('🔄 App came to foreground - resuming call listener');
        if (user?.id && !isListening) {
          startListening();
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background - stop listening to save battery
        console.log('⏸️ App went to background - pausing call listener');
        stopListening();
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user?.id, isListening]);

  // Start listening when user logs in
  useEffect(() => {
    if (user?.id) {
      console.log(`👤 User logged in: ${user.username} (ID: ${user.id})`);
      startListening();
    } else {
      console.log('👤 User logged out - stopping call listener');
      stopListening();
      setIncomingCall(null);
    }

    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, [user?.id]);

  // Function to manually resume listening (called when leaving call screens)
  const resumeListening = () => {
    console.log('🔄 Manually resuming call listener...');
    if (user?.id && !isListening) {
      startListening();
    }
  };

  // Function to manually stop listening (called when entering call screens)
  const pauseListening = () => {
    console.log('⏸️ Manually pausing call listener...');
    stopListening();
  };

  return {
    incomingCall,
    isListening,
    resumeListening,
    pauseListening,
  };
};

export default useIncomingCallListener; 