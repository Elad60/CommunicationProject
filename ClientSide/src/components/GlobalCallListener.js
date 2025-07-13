import React, {useEffect, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import useIncomingCallListener from '../hooks/useIncomingCallListener';
import {useAuth} from '../context/AuthContext';

const GlobalCallListener = () => {
  console.log('🌐 GlobalCallListener RENDER'); // Track every render
  
  const navigation = useNavigation();
  
  // Add safety check for useAuth context
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('❌ GlobalCallListener: useAuth error:', error);
    return null; // Return null if context is not available
  }
  
  const {user} = authContext;
  const currentScreenRef = useRef(null);
  const userIdRef = useRef(user?.id);
  
  console.log('🌐 GlobalCallListener: User from context:', user);
  console.log('🌐 GlobalCallListener: User ID:', user?.id);
  
  const {isListening, pauseListening, resumeListening} = useIncomingCallListener(navigation);
  
  console.log('🌐 GlobalCallListener: isListening:', isListening);

  // Update user ref when user changes
  useEffect(() => {
    userIdRef.current = user?.id;
    console.log('🌐 GlobalCallListener: User ID updated to:', user?.id);
  }, [user?.id]);

  // Handle screen changes via navigation listeners - STABLE useEffect
  useEffect(() => {
    console.log('🌐 GlobalCallListener: Setting up navigation listener');
    
    const unsubscribeState = navigation.addListener('state', (e) => {
      try {
        // Add safety checks for state access
        if (!e || !e.data || !e.data.state || !e.data.state.routes) {
          console.log('⚠️ GlobalCallListener: Invalid navigation state received');
          return;
        }
        
        const state = e.data.state;
        const currentRoute = state.routes[state.index];
        const currentScreenName = currentRoute?.name;
        
        if (!currentScreenName) {
          console.log('⚠️ GlobalCallListener: No screen name found');
          return;
        }
        
        // Only process if screen actually changed
        if (currentScreenRef.current !== currentScreenName) {
          console.log('🌐 GlobalCallListener: Screen changed from', currentScreenRef.current, 'to', currentScreenName);
          currentScreenRef.current = currentScreenName;
          
          if (userIdRef.current) {
            // Pause polling for all call-related screens where user should focus on current call
            const callScreens = ['PrivateCall', 'WaitingForCall', 'IncomingCall'];
            
            if (callScreens.includes(currentScreenName)) {
              console.log(`🛑 GlobalCallListener: Entering ${currentScreenName} - PAUSING incoming call polling`);
              pauseListening();
            } else {
              console.log(`✅ GlobalCallListener: In ${currentScreenName} - RESUMING incoming call polling`);
              resumeListening();
            }
          } else {
            console.log('⚠️ GlobalCallListener: No user logged in, skipping polling control');
          }
        }
      } catch (error) {
        console.error('❌ GlobalCallListener navigation error:', error);
      }
    });

    // Component lifecycle logging
    console.log('🌐 GlobalCallListener MOUNTED');
    
    return () => {
      console.log('🌐 GlobalCallListener UNMOUNTED');
      unsubscribeState();
    };
  }, [navigation, pauseListening, resumeListening]); // REMOVED user?.id dependency

  // Separate useEffect for initial startup to avoid timing issues
  useEffect(() => {
    console.log('🌐 GlobalCallListener: User effect triggered');
    console.log('🌐 GlobalCallListener: User object:', JSON.stringify(user, null, 2));
    console.log('🌐 GlobalCallListener: User ID:', user?.id);
    
    if (user?.id) {
      console.log('🌐 GlobalCallListener: User logged in, starting polling for user:', user.id);
      console.log('🌐 GlobalCallListener: About to call resumeListening...');
      try {
        resumeListening();
        console.log('🌐 GlobalCallListener: resumeListening called successfully');
      } catch (error) {
        console.error('❌ GlobalCallListener initial setup error:', error);
      }
    } else {
      console.log('🌐 GlobalCallListener: No user logged in, stopping polling');
      console.log('🌐 GlobalCallListener: About to call pauseListening...');
      try {
        pauseListening();
        console.log('🌐 GlobalCallListener: pauseListening called successfully');
      } catch (error) {
        console.error('❌ GlobalCallListener pause error:', error);
      }
    }
  }, [user?.id, resumeListening, pauseListening]); // ✅ FIXED: Dedicated effect for user login state

  // This component doesn't render anything - it's just for side effects
  return null;
};

export default GlobalCallListener; 