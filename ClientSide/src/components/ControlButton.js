// ControlButton.js
import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Image, View} from 'react-native';

const ControlButton = ({
  title,
  icon,
  value,
  onPress,
  textColor,
  darkMode,
  isSelected,
  isFirst,
  isLast,
}) => {
  const buttonStyles = [
    styles.button,
    isFirst && styles.first,
    isLast && styles.last,
    isSelected && styles.selected,
  ];

  const overlayStyles = [styles.overlay, isSelected && styles.overlaySelected];

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress}>
      <View style={overlayStyles} />
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      {value !== undefined && (
        <Text style={[styles.value, {color: textColor}]}>{value}%</Text>
      )}
      <Text style={[styles.title, isSelected && styles.selectedText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 90,
    height: 60,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 1,
    borderTopWidth: 1,
    borderTopColor: '#4e4d4d',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 0,
    elevation: 5,
  },
  selected: {
    backgroundColor: '#1d1d1d',
    borderTopWidth: 0,
    elevation: 0,
  },
  first: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  last: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  overlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '103%',
    height: '100%',
    borderRadius: 10,
    transform: [{translateX: -46.35}, {translateY: -30}],
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  overlaySelected: {
    backgroundColor: 'rgba(202, 226, 253, 0.3)',
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 4,
    zIndex: 1,
  },
  value: {
    fontSize: 12,
    textAlign: 'center',
    width: '80%',
    flexWrap: 'wrap',
    zIndex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 3,
    zIndex: 1,
  },
  selectedText: {
    color: 'rgb(202, 226, 253)',
    textShadowColor: '#cae2fd',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
});

export default ControlButton;
