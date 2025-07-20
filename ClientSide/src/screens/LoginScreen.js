import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import authBackgroundPic from '../../assets/images/tank.jpg';
import IronWaveLogo from '../../assets/logos/comm.png';

const LoginScreen = ({onLogin, onNavigateToRegister}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Reset previous errors
    setError('');

    // Input validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
  
    setIsLoading(true);
    
    try {
      // Call the login function passed from parent
      const result = await onLogin(username, password);
      console.log('Login result:', result);
      
      if (!result || !result.success) {
        // Display the specific error message from the server
        setError(result?.message || 'Login failed');
        
        // Show alert with specific error message
        Alert.alert(
          'Login Failed',
          result?.message || 'An error occurred during login.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      setError('An error occurred during login');
      Alert.alert(
        'Login Error',
        'An error occurred during login. Please try again.',
        [{ text: 'OK' }]
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ImageBackground
      source={authBackgroundPic}
      style={styles.backgroundImage}
      resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={IronWaveLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>IronWave System</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>


          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.registerText}>
              Don't have an account? Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Add a semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0066cc',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  formContainer: {
    width: 400,
    padding: 30,
    backgroundColor: 'rgba(30, 30, 30, 0.9)', // Semi-transparent background
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#fff',
    paddingTop: 10,
    paddingLeft: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0066cc',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#0066cc',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
  },
});

export default LoginScreen;
