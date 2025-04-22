// App.tsx
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {SettingsProvider} from './src/context/SettingsContext';
import {AnnouncementsProvider} from './src/context/AnnouncementsContext';

// Component that handles the authentication flow and screen switching
const AppContent = () => {
  const {user, loading, login, register} = useAuth();
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Show a loading indicator while checking authentication status
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // If no user is logged in, show login or registration screen
  if (!user) {
    return isRegistering ? (
      <RegisterScreen
        onRegister={async (username: any, password: any, email: any, group: any) => {
          // Call the register function from AuthContext
          const result = await register(username, password, email, group);
          if (result?.success) {
            setIsRegistering(false); // Go back to login screen after successful registration
            return {success: true};
          }
          return result || {success: false, message: 'Registration failed'};
        }}
        onNavigateToLogin={() => setIsRegistering(false)}
      />
    ) : (
      <LoginScreen
        onLogin={async (username: any, password: any) => {
          // Call the login function from AuthContext
          const result = await login(username, password);
          return result || {success: false, message: 'Login failed'};
        }}
        onNavigateToRegister={() => setIsRegistering(true)}
      />
    );
  }

  // If user is logged in, show the main app navigation
  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
};

// Root component wrapping the app with context providers
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SettingsProvider>
        <AuthProvider>
          <AnnouncementsProvider>
            <AppContent />
          </AnnouncementsProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaView>
  );
};

// Global styles for layout and theming
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
