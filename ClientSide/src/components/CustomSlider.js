/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

const CustomSlider = ({ value = 0.5, onValueChange = () => {}, label = 'Brightness', darkMode }) => {
  const trackWidth = 300;
  const thumbSize = 18;

  // Convert value [0–1] to X position on the track
  const valueToX = (val) => val * (trackWidth - thumbSize);
  // Convert X position to value [0–1]
  const xToValue = (x) => Math.min(Math.max(x / (trackWidth - thumbSize), 0), 1);

  const panX = useRef(valueToX(value));
  const animatedX = useRef(new Animated.Value(panX.current)).current;

  useEffect(() => {
    // Animate thumb position if value is updated externally
    Animated.spring(animatedX, {
      toValue: valueToX(value),
      friction: 8, // Controls smoothness
      tension: 40, // Controls responsiveness
      useNativeDriver: false,
    }).start();
  }, [value]);

  // Create gesture handler for dragging the thumb
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start tracking movement
        animatedX.setOffset(panX.current);
        animatedX.setValue(0);
      },
      onPanResponderMove: (evt, gesture) => {
        // Calculate new X while staying within bounds
        let newX = Math.min(Math.max(panX.current + gesture.dx, 0), trackWidth - thumbSize);
        animatedX.setValue(newX - panX.current);
        onValueChange(xToValue(newX)); // Update external value
      },
      onPanResponderRelease: (evt, gesture) => {
        // Finalize position
        const currentX = Math.min(Math.max(panX.current + gesture.dx, 0), trackWidth - thumbSize);
        panX.current = currentX;
        animatedX.flattenOffset(); // Reset offset
        onValueChange(xToValue(currentX));
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: darkMode ? '#fff' : '#000' }]}>{label}</Text>
      <View style={styles.trackContainer}>
        <View
          style={[
            styles.track,
            {
              width: trackWidth,
              backgroundColor: darkMode ? '#0066cc' : '#91aad4',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: animatedX }],
                backgroundColor: darkMode ? '#fff' : '#000',
              },
            ]}
            {...panResponder.panHandlers} // Attach drag handlers
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    marginLeft: -20,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    width: 300,
    height: 22,
    backgroundColor: '#0066cc',
    borderRadius: 15,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    top: '50%',
    marginTop: -9, // Center the thumb vertically
  },
});

export default CustomSlider;
