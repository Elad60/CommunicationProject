import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import authBackgroundPic from '../../assets/images/tank.jpg';

const RegisterScreen = ({onRegister, onNavigateToLogin}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [group, setGroup] = useState('');
  const validateForm = () => {
    // Required fields check
    if (
      !username ||
      !password ||
      !confirmPassword ||
      !email ||
      !group
    ) {
      setError('Please fill in all fields');
      return false;
    }

    // Username validation
    if (username.length < 4) {
      setError('Username must be at least 4 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Strong password check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      );
      return false;
    }

    // Passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Call the register function passed from parent
      const result = await onRegister(username, password, email, group);

      // Check if result exists before accessing its properties
      if (result && !result.success) {
        setError(result.message || 'Registration failed');
      } else if (!result) {
        // Handle case where result is undefined
        setError('Registration failed: No response from server');
      } else {
        // Registration success
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [{text: 'OK', onPress: () => onNavigateToLogin()}],
        );
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

    if (strength < 2) return {text: 'Weak', color: '#ff4d4f'};
    if (strength < 4) return {text: 'Medium', color: '#faad14'};
    return {text: 'Strong', color: '#52c41a'};
  };
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const passwordStrength = getPasswordStrength();

  return (
    <ImageBackground
      source={authBackgroundPic}
      style={styles.backgroundImage}
      resizeMode="cover">
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>
              Register to access the communication system
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Username (min. 4 characters)"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={20}
            />

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#888"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {passwordStrength && (
              <Text
                style={[
                  styles.passwordStrength,
                  {color: passwordStrength.color},
                ]}>
                Password strength: {passwordStrength.text}
              </Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>
                Password must contain:
              </Text>
              <Text style={styles.requirementItem}>
                • At least 8 characters
              </Text>
              <Text style={styles.requirementItem}>• One uppercase letter</Text>
              <Text style={styles.requirementItem}>• One lowercase letter</Text>
              <Text style={styles.requirementItem}>• One number</Text>
              <Text style={styles.requirementItem}>
                • One special character
              </Text>
            </View>
            <Text style={styles.label}>Select Group</Text>
            <View style={styles.letterContainer}>
              {letters.map(letter => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.letterButton,
                    group === letter && styles.letterButtonSelected,
                  ]}
                  onPress={() => setGroup(letter)}>
                  <Text
                    style={[
                      styles.letterText,
                      group === letter && styles.letterTextSelected,
                    ]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  passwordStrength: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  passwordRequirements: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    backgroundColor: 'rgba(42, 42, 42, 0.8)', // Semi-transparent
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  requirementsTitle: {
    color: '#fff',
    marginBottom: 5,
    fontSize: 14,
  },
  requirementItem: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 2,
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
  loginText: {
    color: '#0066cc',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  letterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  letterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  letterButtonSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  letterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  letterTextSelected: {
    color: '#fff',
  },
});

export default RegisterScreen;
