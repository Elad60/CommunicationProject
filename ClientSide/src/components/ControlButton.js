/* eslint-disable react-native/no-inline-styles */
import React, {useRef} from 'react';
import {Animated, Text, StyleSheet, Image, Pressable} from 'react-native';

const ControlButton = ({title, icon, value, onPress, darkMode, isSelected, height, width}) => {
  // Animated scale for hover interaction
  const scale = useRef(new Animated.Value(1)).current;

  const handleHoverIn = () => {
    Animated.spring(scale, {
      toValue: 1.1, // Slight zoom-in on hover
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.spring(scale, {
      toValue: 1, // Return to original size
      useNativeDriver: true,
    }).start();
  };

  // Dynamic styles based on dark mode and selection
  const backgroundColor = darkMode ? '#2b2b2b' : '#f8f8f8';
  const borderColor = isSelected ? '#3b82f6' : darkMode ? '#555' : '#ccc';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={{marginHorizontal: 8}}>
      <Animated.View
        style={[
          styles.button,
          {
            width: width * 0.10,
            height: height * 0.1,
            backgroundColor,
            borderColor,
            borderWidth: isSelected ? 2 : 1,
            transform: [{scale}], // Scale animation
            shadowColor: isSelected ? '#3b82f6' : '#000',
            shadowOpacity: isSelected ? 0.3 : 0.1,
            elevation: isSelected ? 6 : 3, // Higher elevation when selected
          },
        ]}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
        {value !== undefined && (
          <Text style={[styles.value, {color: textColor}]}>{value}%</Text>
        )}
        <Text style={[styles.title, {color: textColor}]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    overflow: 'hidden',
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    marginBottom: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ControlButton;
