import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import authBackgroundPic from '../../assets/images/tank.jpg';

// Imports, state declarations, and styles...
const RegisterScreen = ({onRegister, onNavigateToLogin}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [group, setGroup] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field-level validation messages
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    group: '',
  });

  // Per-field validation logic
  const validateField = (field, value) => {
    switch (field) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 4) return 'Username must be at least 4 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/\d/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain at least one special character';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
      case 'group':
        if (!value) return 'Please select a group';
        return '';
      default:
        return '';
    }
  };

  // Update field value and run validation
  const handleFieldChange = (field, value) => {
    switch (field) {
      case 'username': setUsername(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
      case 'group': setGroup(value); break;
    }
    setFieldErrors(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  // Run validation on all fields before submitting
  const validateForm = () => {
    const newFieldErrors = {
      username: validateField('username', username),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
      group: validateField('group', group),
    };
    setFieldErrors(newFieldErrors);
    return !Object.values(newFieldErrors).some(error => error !== '');
  };

  // Submit registration
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await onRegister(username, password, email, group);
      console.log('Register result in component:', result);

      if (result && result.success) {
        Alert.alert(
          'Registration Successful',
          result.message || 'Your account has been created successfully!',
          [
            { text: 'Continue', onPress: () => onNavigateToLogin() }
          ],
          { cancelable: false }
        );
      } else {
        setError(result?.message || 'Registration failed');
        Alert.alert(
          'Registration Failed',
          result?.message || 'Registration failed. Please try again.'
        );
      }
    } catch (err) {
      // Handle unexpected errors
    } finally {
      setIsLoading(false);
    }
  };

  // Show password strength feedback
  const getPasswordStrength = () => {
    if (!password) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
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
            <Text style={styles.subtitle}>Register to access the communication system</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Input Fields and Validations */}
            {/* ... all inputs wrapped with handleFieldChange and fieldErrors display */}

            {/* Group Selection */}
            <Text style={styles.label}>Select Group</Text>
            <View style={styles.letterContainer}>
              {letters.map(letter => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.letterButton,
                    group === letter && styles.letterButtonSelected,
                  ]}
                  onPress={() => handleFieldChange('group', letter)}>
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

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Navigate to Login */}
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginText}>Already have an account? Login</Text>
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
  buttonDisabled: {
    backgroundColor: '#004d99',
    opacity: 0.7,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  fieldError: {
    color: '#ff6b6b',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: -10,
    marginBottom: 10,
  },
});

export default RegisterScreen;
