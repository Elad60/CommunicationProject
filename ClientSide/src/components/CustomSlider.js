import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, PanResponder, Animated} from 'react-native';

const SLIDER_WIDTH = 300;
const THUMB_SIZE = 28;

const CustomSlider = ({
  value = 0.5,
  onValueChange = () => {},
  label = 'Volume',
  darkMode,
}) => {
  // Utility functions to convert between value [0-1] and X position
  const valueToX = val => val * (SLIDER_WIDTH - THUMB_SIZE);
  const xToValue = x =>
    Math.min(Math.max(x / (SLIDER_WIDTH - THUMB_SIZE), 0), 1);

  const panX = useRef(valueToX(value));
  const animatedX = useRef(new Animated.Value(panX.current)).current;

  // Animate the thumb when the value prop changes
  useEffect(() => {
    Animated.spring(animatedX, {
      toValue: valueToX(value),
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [value]);

  // Handle dragging behavior with PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        animatedX.setOffset(panX.current);
        animatedX.setValue(0);
      },
      onPanResponderMove: (evt, gesture) => {
        let newX = Math.min(
          Math.max(panX.current + gesture.dx, 0),
          SLIDER_WIDTH - THUMB_SIZE,
        );
        animatedX.setValue(newX - panX.current);
        onValueChange(xToValue(newX));
      },
      onPanResponderRelease: (evt, gesture) => {
        const currentX = Math.min(
          Math.max(panX.current + gesture.dx, 0),
          SLIDER_WIDTH - THUMB_SIZE,
        );
        panX.current = currentX;
        animatedX.flattenOffset();
        onValueChange(xToValue(currentX));
      },
    }),
  ).current;

  // Calculate the fill width for the track
  const fillWidth = animatedX.interpolate({
    inputRange: [0, SLIDER_WIDTH - THUMB_SIZE],
    outputRange: [0, SLIDER_WIDTH - THUMB_SIZE],
    extrapolate: 'clamp',
  });

  // Calculate the value for display (0-100)
  const displayValue = Math.round(
    (animatedX.__getValue() / (SLIDER_WIDTH - THUMB_SIZE)) * 100,
  );

  // Colors
  const accent = darkMode ? '#1DB954' : '#1976d2';
  const trackBg = darkMode ? '#333' : '#e0e0e0';
  const thumbShadow = darkMode ? '#1DB95455' : '#1976d255';

  return (
    <View style={styles.outerContainer}>
      {/* Label */}
      <Text style={[styles.label, {color: darkMode ? '#fff' : '#222'}]}>
        {label}
      </Text>
      <View style={styles.sliderContainer}>
        {/* Value above thumb */}
        <Animated.View
          style={[
            styles.valueBubble,
            {
              left: Animated.add(
                animatedX,
                new Animated.Value(THUMB_SIZE / 2 - 18),
              ),
              backgroundColor: darkMode ? '#222' : '#fff',
              borderColor: accent,
            },
          ]}
          pointerEvents="none">
          <Text style={[styles.valueText, {color: accent}]}>
            {Math.round(value * 100)}
          </Text>
        </Animated.View>
        {/* Track */}
        <View style={[styles.track, {backgroundColor: trackBg}]}>
          <Animated.View
            style={[
              styles.trackFill,
              {
                width: fillWidth,
                backgroundColor: accent,
              },
            ]}
          />
          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{translateX: animatedX}],
                backgroundColor: '#fff',
                borderColor: accent,
                shadowColor: thumbShadow,
              },
            ]}
            {...panResponder.panHandlers}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: SLIDER_WIDTH,
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: SLIDER_WIDTH,
    height: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 12,
    borderRadius: 8,
    backgroundColor: '#1DB954',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#1DB954',
    backgroundColor: '#fff',
    top: -8,
    shadowColor: '#1DB95455',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  valueBubble: {
    position: 'absolute',
    top: -36,
    width: 36,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  valueText: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});

export default CustomSlider;
