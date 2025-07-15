// App.tsx
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  AppRegistry,
} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {SettingsProvider} from './src/context/SettingsContext';
import {AnnouncementsProvider} from './src/context/AnnouncementsContext';
import {VoiceProvider} from './src/context/VoiceContext';
import {name as appName} from './app.json';

// Enable remote debugging
if (__DEV__) {
  const websocket = require('ws');
  const {connectToDevTools} = require('react-devtools-core');
  connectToDevTools({
    host: 'localhost',
    port: 8082,
    websocket: websocket,
  });
}

// Component that handles auth flow - THIS MUST BE INSIDE AuthProvider
const AppContent = () => {
  const {user, loading, login, register} = useAuth();
  const [isRegistering, setIsRegistering] = React.useState(false);

  console.log('📱 AppContent: Rendering with user:', user, 'loading:', loading);

  if (loading) {
    console.log('📱 AppContent: Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!user) {
    console.log('📱 AppContent: No user, showing auth screens');
    return isRegistering ? (
      <RegisterScreen
        onRegister={async (
          username: any,
          password: any,
          email: any,
          group: any,
        ) => {
          const result = await register(username, password, email, group);
          if (result?.success) {
            setIsRegistering(false);
            return {success: true};
          }
          return result || {success: false, message: 'Registration failed'};
        }}
        onNavigateToLogin={() => setIsRegistering(false)}
      />
    ) : (
      <LoginScreen
        onLogin={async (username: any, password: any) => {
          const result = await login(username, password);
          return result || {success: false, message: 'Login failed'};
        }}
        onNavigateToRegister={() => setIsRegistering(true)}
      />
    );
  }

  console.log('📱 AppContent: User logged in, showing AppNavigator');
  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
};

// Root app with all providers
const App = () => {
  console.log('📱 App: Starting app render');
  console.log('📱 App: Testing debug connection');
  console.log('📱 App: App is rendering!');
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <SettingsProvider>
          <AnnouncementsProvider>
            <VoiceProvider>
              <AppContent />
            </VoiceProvider>
          </AnnouncementsProvider>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default App;

// Register the app
AppRegistry.registerComponent(appName, () => App);
