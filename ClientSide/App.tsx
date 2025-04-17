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
import {TutorialProvider} from './src/context/TutorialContext';
import {AnnouncementsProvider} from './src/context/AnnouncementsContext'; // הוספת קונטקסט ההודעות

// Component that handles auth flow
const AppContent = () => {
  const {user, loading, login, register} = useAuth();
  const [isRegistering, setIsRegistering] = React.useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!user) {
    return isRegistering ? (
      <RegisterScreen
        onRegister={async (username: any, password: any, email: any, group: any) => {
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

  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
};

// Root app with all providers
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <TutorialProvider>
        <SettingsProvider>
          <AuthProvider>
            <AnnouncementsProvider>
              <AppContent />
            </AnnouncementsProvider>
          </AuthProvider>
        </SettingsProvider>
      </TutorialProvider>
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