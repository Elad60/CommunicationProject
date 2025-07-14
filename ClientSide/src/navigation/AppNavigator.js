// src/navigation/AppNavigator.js
import React from 'react';
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
import UserManagementScreen from '../screens/UserManagementScreen';
import PickRadiosScreen from '../screens/PickRadiosScreen';
import PrivateCallScreen from '../screens/PrivateCallScreen';
import WaitingForCallScreen from '../screens/WaitingForCallScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import GlobalCallListener from '../components/GlobalCallListener';

const Stack = createStackNavigator();

const AppNavigator = () => {
  console.log('🧭 AppNavigator: Starting render');
  
  // Add safety check for useAuth context
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('❌ AppNavigator: useAuth error:', error);
    return null; // Return null if context is not available
  }
  
  const {user, login, register} = authContext;
  console.log('🧭 AppNavigator: Got user from context:', user);

  return (
    <NavigationContainer>
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
        <>
          <Stack.Navigator
            initialRouteName="Groups"
            screenOptions={{
              headerShown: false, // Hide the default header since we have our own in AppLayout
            }}>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ChannelConfig" component={ChannelConfigScreen} />
            <Stack.Screen name="Groups" component={GroupsScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen}/>
            <Stack.Screen name="PickRadios" component={PickRadiosScreen} />
            <Stack.Screen name="PrivateCall" component={PrivateCallScreen} />
            <Stack.Screen name="WaitingForCall" component={WaitingForCallScreen} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
          </Stack.Navigator>
          <GlobalCallListener />
        </>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
