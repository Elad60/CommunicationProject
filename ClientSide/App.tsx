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

// Main App component with auth routing
const AppContent = () => {
  const {user, loading, login, register, logout} = useAuth();
  const [isRegistering, setIsRegistering] = React.useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // If user is not logged in, show auth screens
  if (!user) {
    if (isRegistering) {
      return (
        <RegisterScreen
          onRegister={async (
            username: string,
            password: string,
            email: string,
          ) => {
            const result = await register(username, password, email);
            if (result && result.success) {
              setIsRegistering(false);
              return {success: true};
            }
            return result || {success: false, message: 'Registration failed'};
          }}
          onNavigateToLogin={() => setIsRegistering(false)}
        />
      );
    } else {
      return (
        <LoginScreen
          onLogin={async (username: string, password: string) => {
            const result = await login(username, password);
            return result || {success: false, message: 'Login failed'};
          }}
          onNavigateToRegister={() => setIsRegistering(true)}
        />
      );
    }
  }

  // If user is logged in, show main app with navigation
  // We're wrapping the AppNavigator with a custom MainScreen component to handle logout
  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
};

// Root component with providers
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
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
