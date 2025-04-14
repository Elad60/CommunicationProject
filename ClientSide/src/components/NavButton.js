import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Image} from 'react-native';

const NavButton = ({title, icon, onPress, isActive, darkMode}) => {
  const buttonBackgroundColor = darkMode ? '#222' : '#bbb';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: buttonBackgroundColor}]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      <Text style={[styles.title, {color: textColor}]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '85%',
    height: 110,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 5,
  },
  title: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default NavButton;
