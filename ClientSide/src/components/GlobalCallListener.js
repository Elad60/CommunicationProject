import React, {useEffect, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import useIncomingCallListener from '../hooks/useIncomingCallListener';
import {useAuth} from '../context/AuthContext';

const GlobalCallListener = () => {
  console.log('🌐 GlobalCallListener RENDER'); // Track every render
  
  const navigation = useNavigation();
  const {user} = useAuth();
  const currentScreenRef = useRef(null);
  const userIdRef = useRef(user?.id);
  
  const {isListening, pauseListening, resumeListening} = useIncomingCallListener(navigation);

  // Update user ref when user changes
  useEffect(() => {
    userIdRef.current = user?.id;
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
            if (currentScreenName === 'PrivateCall') {
              console.log('🛑 GlobalCallListener: Entering PrivateCall - PAUSING incoming call polling');
              pauseListening();
            } else {
              console.log('✅ GlobalCallListener: Not in PrivateCall - RESUMING incoming call polling');
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
    
    // Initial setup when user is logged in
    if (userIdRef.current) {
      console.log('🌐 GlobalCallListener: Initial setup - user logged in, starting polling');
      try {
        resumeListening();
      } catch (error) {
        console.error('❌ GlobalCallListener initial setup error:', error);
      }
    } else {
      console.log('🌐 GlobalCallListener: No user logged in on mount');
    }

    return () => {
      console.log('🌐 GlobalCallListener UNMOUNTED');
      unsubscribeState();
    };
  }, [navigation, pauseListening, resumeListening]); // REMOVED user?.id dependency

  // This component doesn't render anything - it's just for side effects
  return null;
};

export default GlobalCallListener; 