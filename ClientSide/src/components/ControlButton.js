import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Image} from 'react-native';

const ControlButton = ({title, icon, value, onPress, textColor, darkMode}) => {
  const buttonBackgroundColor = darkMode ? '#222' : '#bbb';

  return (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: buttonBackgroundColor}]}
      onPress={onPress}>
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      {value !== undefined && (
        <Text style={[styles.value, {color: textColor}]}>{value}%</Text>
      )}
      <Text style={[styles.title, {color: textColor}]}>{title}</Text>
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
    width: 30,
    height: 30,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
  },
});

export default ControlButton;
