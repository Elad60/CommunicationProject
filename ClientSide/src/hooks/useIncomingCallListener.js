import {useState, useEffect, useRef, useCallback} from 'react';
import {privateCallApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';

const useIncomingCallListener = (navigation) => {
  console.log('🎣 useIncomingCallListener CALLED'); // Track every call
  
  const {user} = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const intervalRef = useRef(null);
  const incomingCallRef = useRef(null); // ✅ FIX: Use ref to avoid infinite loop

  // Update ref whenever incomingCall changes
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // Check for incoming calls - STABLE function
  const checkForIncomingCalls = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      console.log('🔍 Checking for incoming calls for user:', user.id);
      const response = await privateCallApi.getIncomingCalls(user.id);
      console.log('📋 Full API Response:', JSON.stringify(response, null, 2));
      
      // ✅ FIX: Check for both IncomingCalls and incomingCalls to handle case sensitivity
      const incomingCalls = response.IncomingCalls || response.incomingCalls;
      
      if (response.success && incomingCalls && incomingCalls.length > 0) {
        const latestCall = incomingCalls[0];
        console.log('📞 Found incoming call:', JSON.stringify(latestCall, null, 2));
        console.log('🔍 Current incomingCallRef:', incomingCallRef.current);
        
        // Check if this is a new call using ref
        const callId = latestCall.Id || latestCall.id; // ✅ FIX: Handle both Id and id
        const currentCallId = incomingCallRef.current?.Id || incomingCallRef.current?.id;
        
        if (!incomingCallRef.current || callId !== currentCallId) {
          console.log('🆕 New incoming call detected!');
          console.log('🆕 Previous call ID:', currentCallId);
          console.log('🆕 New call ID:', callId);
          
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
        } else {
          console.log('📞 Same call as before, not navigating');
          console.log('📞 Current ID:', currentCallId, 'New ID:', callId);
        }
      } else {
        console.log('📭 No incoming calls found - Response:', JSON.stringify(response, null, 2));
        console.log('🔍 Checked both IncomingCalls and incomingCalls properties');
        if (incomingCallRef.current) {
          console.log('🔄 Clearing previous incoming call state');
          setIncomingCall(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for incoming calls:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  }, [user?.id, navigation]); // ✅ FIX: Removed incomingCall dependency

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
    
    console.log('🔔 Starting to listen for incoming calls for user:', user.id);
    setIsListening(true);
    
    // Check immediately
    console.log('🔔 Checking immediately...');
    checkForIncomingCalls();
    
    // Then check every 3 seconds
    console.log('🔔 Setting up 3-second interval...');
    intervalRef.current = setInterval(() => {
      console.log('⏰ Interval tick - checking for calls...');
      checkForIncomingCalls();
    }, 3000);
    
    console.log('🔔 Interval set with ID:', intervalRef.current);
  }, [user?.id, checkForIncomingCalls]);

  // Stop listening - STABLE function
  const stopListening = useCallback(() => {
    console.log('🔕 Stopping incoming call listener...');
    setIsListening(false);
    
    if (intervalRef.current) {
      console.log('🔕 Clearing interval:', intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
    console.log('🔄 User ID:', user?.id);
    try {
      if (user?.id) {
        startListening();
      } else {
        console.log('⚠️ Cannot resume listening - no user logged in');
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

  // Log state changes
  useEffect(() => {
    console.log('📊 Listener state - isListening:', isListening, 'intervalRef:', !!intervalRef.current);
  }, [isListening]);

  return {
    incomingCall,
    isListening,
    resumeListening,
    pauseListening,
  };
};

export default useIncomingCallListener; 