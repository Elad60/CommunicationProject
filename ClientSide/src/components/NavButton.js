import React, {useRef} from 'react';
import {Animated, StyleSheet, Image, Text, Pressable} from 'react-native';

const NavButton = ({title, icon, onPress, isActive, darkMode}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handleHoverIn = () => {
    Animated.spring(scale, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = darkMode ? '#2b2b2b' : '#f8f8f8';
  const borderColor = isActive ? '#3b82f6' : darkMode ? '#555' : '#ccc';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={{marginVertical: 6}}>
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{scale}],
            backgroundColor,
            borderColor,
            borderWidth: isActive ? 2 : 1,
            shadowColor: isActive ? '#3b82f6' : '#000',
            shadowOpacity: isActive ? 0.3 : 0.1,
          },
        ]}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
        <Text style={[styles.title, {color: textColor}]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    width: 80,
    height:100,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default NavButton;
