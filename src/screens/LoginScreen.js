import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
// In your LoginScreen.js, import the image directly
import authBackgroundPic from '../../assets/images/tank.jpg';
import techmerLogo from '../../assets/logos/techmerLogo.jpeg';

const LoginScreen = ({onLogin, onNavigateToRegister}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      // Call the login function passed from parent
      const result = await onLogin(username, password);
      if (result && !result.success) {
        setError(result.message || 'Login failed');
        Alert.alert(
          'Login Failed',
          'Invalid username/password. Please try again.',
        );
      } else if (!result) {
        setError('Login failed: No response from server');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
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
            source={techmerLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Communication System</Text>
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

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
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
