import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';

const ControlButton = ({title, icon, value, onPress}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      {value !== undefined && <Text style={styles.value}>{value}%</Text>}
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '10%',
    height: '90%',
    backgroundColor: '#222',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: '50%',
    color: '#fff',
  },
  value: {
    color: '#fff',
    fontSize: '7%', 
    textAlign: 'center',  
    width: '80%',  
    flexWrap: 'wrap', 
  },
  title: {
    color: '#fff',
    fontSize: '5%', 
    textAlign: 'center',  
    width: '80%',  
    flexWrap: 'wrap', 
  },
});

export default ControlButton;
