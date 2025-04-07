import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ControlButton = ({ title, icon, value, onPress, textColor, darkMode }) => {
  // Set button background color based on darkMode
  const buttonBackgroundColor = darkMode ? '#222' : '#bbb'; // Light gray when darkMode is off

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
      onPress={onPress}
    >
      <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      {value !== undefined && <Text style={[styles.value, { color: textColor }]}>{value}%</Text>}
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '20%',
    height: '90%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: '50%',
  },
  value: {
    fontSize: '7%',
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '5%',
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
  },
});

export default ControlButton;
