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
import {useAuth} from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {logout} = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {/* Removed the first duplicate Main screen */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
        <Stack.Screen
          name="ChannelConfig"
          component={ChannelConfigScreen}
          options={{title: 'Channel Configuration'}}
        />
        <Stack.Screen
          name="Groups"
          component={GroupsScreen}
          options={{title: 'Groups'}}
        />
        <Stack.Screen
          name="Intercoms"
          component={IntercomsScreen}
          options={{title: 'Intercoms'}}
        />
        <Stack.Screen
          name="Pas"
          component={PasScreen}
          options={{title: 'Public Address System'}}
        />
        <Stack.Screen
          name="Relay"
          component={RelayScreen}
          options={{title: 'Relay Configuration'}}
        />
        <Stack.Screen
          name="Main"
          options={{title: 'Communication System', headerShown: false}}>
          {props => <MainScreen {...props} onLogout={logout} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
