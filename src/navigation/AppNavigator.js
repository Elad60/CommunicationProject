// src/navigation/AppNavigator.js
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChannelConfigScreen from '../screens/ChannelConfigScreen';
import GroupsScreen from '../screens/GroupsScreen';
import IntercomsScreen from '../screens/IntercomsScreen';
import PasScreen from '../screens/PasScreen';
import RelayScreen from '../screens/RelayScreen';
import ControlScreen from '../screens/ControlScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import {useAuth} from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {user, login, register} = useAuth();

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
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerShown: false, // Hide the default header since we have our own in AppLayout
          }}>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ChannelConfig" component={ChannelConfigScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="Intercoms" component={IntercomsScreen} />
          <Stack.Screen name="Pas" component={PasScreen} />
          <Stack.Screen name="Relay" component={RelayScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
