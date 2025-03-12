import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import MainScreen from './src/screens/MainScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import {AuthProvider, useAuth} from './src/context/AuthContext';

// This component needs to be INSIDE the AuthProvider to use the hook
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
          onRegister={async (username, password, email) => {
            const result = await register(username, password, email);
            if (result.success) {
              setIsRegistering(false);
            }
          }}
          onNavigateToLogin={() => setIsRegistering(false)}
        />
      );
    } else {
      return (
        <LoginScreen
          onLogin={login}
          onNavigateToRegister={() => setIsRegistering(true)}
        />
      );
    }
  }
//fsaf
  // If user is logged in, show main app
  return <MainScreen onLogout={logout} />;
};

// Root component with providers
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <AppContent />
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
