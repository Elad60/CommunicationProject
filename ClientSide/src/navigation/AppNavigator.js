// src/navigation/AppNavigator.js
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChannelConfigScreen from '../screens/MoreRadiosScreen';
import GroupsScreen from '../screens/GroupsScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import {useAuth} from '../context/AuthContext';
import {useVoice} from '../context/VoiceContext';
import UserManagementScreen from '../screens/UserManagementScreen';
import PickRadiosScreen from '../screens/PickRadiosScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {user, login, register} = useAuth();
  const { initializeVoice, VOICE_ENABLED_SCREENS } = useVoice();

  // Initialize voice when app starts
  useEffect(() => {
    console.log('🎬 AppNavigator - initializing voice system...');
    initializeVoice();
  }, []);

  // Handle navigation state changes for voice management
  const handleNavigationStateChange = (state) => {
    if (state && state.routes && state.routes.length > 0) {
      const currentRoute = state.routes[state.index];
      const screenName = currentRoute.name;
      const isVoiceEnabled = VOICE_ENABLED_SCREENS[screenName];
      
      console.log(`🎬 Navigation to: ${screenName}, Voice enabled: ${isVoiceEnabled}`);
      
      if (!isVoiceEnabled) {
        console.log(`⚠️ Voice disabled for screen: ${screenName}`);
      }
    }
  };

  return (
    <NavigationContainer onStateChange={handleNavigationStateChange}>
      {!user ? (
        // Auth navigator when user is not logged in
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Login">
            {props => (
              <LoginScreen
                {...props}
                onLogin={login}
                onNavigateToRegister={() =>
                  props.navigation.navigate('Register')
                }
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {props => (
              <RegisterScreen
                {...props}
                onRegister={register}
                onNavigateToLogin={() => props.navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // App navigator when user is logged in
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerShown: false, // Hide the default header since we have our own in AppLayout
          }}>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ChannelConfig" component={ChannelConfigScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          <Stack.Screen
            name="UserManagement"
            component={UserManagementScreen}
          />
          <Stack.Screen name="PickRadios" component={PickRadiosScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
