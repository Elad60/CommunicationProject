import {useState, useEffect, useRef, useCallback} from 'react';
import {privateCallApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';

const useIncomingCallListener = (navigation) => {
  console.log('🎣 useIncomingCallListener CALLED'); // Track every call
  
  const {user} = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const intervalRef = useRef(null);

  // Check for incoming calls - STABLE function
  const checkForIncomingCalls = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Checking for incoming calls...');
      const response = await privateCallApi.getIncomingCalls(user.id);
      
      if (response.success && response.IncomingCalls && response.IncomingCalls.length > 0) {
        const latestCall = response.IncomingCalls[0];
        console.log('📞 Found incoming call:', latestCall);
        
        // Check if this is a new call
        if (!incomingCall || latestCall.Id !== incomingCall.Id) {
          console.log('🆕 New incoming call detected!');
          setIncomingCall(latestCall);
          
          // Navigate and stop listening
          console.log('✅ Navigating to IncomingCall');
          navigation.navigate('IncomingCall', {
            callInvitation: latestCall,
          });
          
          // Stop current polling
          setIsListening(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        console.log('📭 No incoming calls found');
        if (incomingCall) {
          setIncomingCall(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for incoming calls:', error);
    }
  }, [user?.id, navigation]); // REMOVED incomingCall, isListening dependencies

  // Start listening - STABLE function
  const startListening = useCallback(() => {
    if (!user?.id) {
      console.log('⚠️ No user - cannot start listening');
      return;
    }
    
    if (intervalRef.current) {
      console.log('⚠️ Already listening - clearing previous interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('🔔 Starting to listen for incoming calls...');
    setIsListening(true);
    
    // Check immediately
    checkForIncomingCalls();
    
    // Then check every 3 seconds
    intervalRef.current = setInterval(() => {
      checkForIncomingCalls();
    }, 3000);
  }, [user?.id, checkForIncomingCalls]);

  // Stop listening - STABLE function
  const stopListening = useCallback(() => {
    console.log('🔕 Stopping incoming call listener...');
    setIsListening(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // REMOVED AppState useEffect - was creating duplicate polling

  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 useIncomingCallListener cleanup');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Resume listening - STABLE function
  const resumeListening = useCallback(() => {
    console.log('🔄 Manually resuming call listener...');
    try {
      if (user?.id) {
        startListening();
      }
    } catch (error) {
      console.error('❌ Error in resumeListening:', error);
    }
  }, [user?.id, startListening]);

  // Pause listening - STABLE function
  const pauseListening = useCallback(() => {
    console.log('⏸️ Manually pausing call listener...');
    try {
      stopListening();
    } catch (error) {
      console.error('❌ Error in pauseListening:', error);
    }
  }, [stopListening]);

  return {
    incomingCall,
    isListening,
    resumeListening,
    pauseListening,
  };
};

export default useIncomingCallListener; 