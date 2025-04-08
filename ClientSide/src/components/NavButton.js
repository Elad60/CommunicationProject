import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const NavButton = ({ title, icon, onPress, isActive, darkMode }) => {
  // Set button background color based on darkMode
  const buttonBackgroundColor = darkMode ? '#222' : '#bbb';  // Darker background for dark mode

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
      onPress={onPress}>
      <Text style={[styles.icon, { color: darkMode ? '#fff' : '#000' }]}>{icon}</Text>
      <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '90%',
    height: '12%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  icon: {
    fontSize: '50%',
    marginBottom: 5,
  },
  title: {
    fontSize: '5%',
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
  },
});

export default NavButton;
