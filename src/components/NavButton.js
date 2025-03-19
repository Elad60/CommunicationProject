import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

const NavButton = ({title, icon, onPress, isActive}) => {
  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.activeButton]}
      onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '90%',
    height: '12%',
    backgroundColor: '#222',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  activeButton: {
    backgroundColor: '#444',
  },
  icon: {
    fontSize: '50%',
    color: '#fff',
    marginBottom: 5,
  },
  title: {
    color: '#fff',
    fontSize: '5%', 
    textAlign: 'center',  
    width: '80%',  
    flexWrap: 'wrap',  
  },
});

export default NavButton;
