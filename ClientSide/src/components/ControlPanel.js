/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-alert */
// ControlPanel.js
// This component shows the control buttons at the bottom of the screen
// It includes buttons for speaker volume, channel volume, mute, and settings
import React, {useRef, useEffect, useState} from 'react';
import {Animated} from 'react-native';
import ControlButton from './ControlButton';
import {useSettings} from '../context/SettingsContext';

const ControlPanel = ({
  speakerVolume,
  setSpeakerVolume,
  selectedChannel,
  navigation,
  darkMode,
  height,
  width,
}) => {
  // Calculate panel dimensions based on screen orientation
  let CONTROL_PANEL_HEIGHT;
  let CONTROL_PANEL_WIDTH;
  const isLandscape = height < width;

  if (isLandscape) {
    CONTROL_PANEL_HEIGHT = height * 0.13;
    CONTROL_PANEL_WIDTH = width * 0.92;
  } else {
    CONTROL_PANEL_HEIGHT = height * 0.1;
    CONTROL_PANEL_WIDTH = width * 0.86;
  }

  // Track which button is currently selected
  const [selectedButton, setSelectedButton] = useState(null);

  // Get settings from context
  const {
    controlBarAdjustment,
    controlPanelPosition,
    setControlPanelPosition,
    toolBarAdjustment,
  } = useSettings();

  // Animation for panel position
  const position = useRef(new Animated.Value(controlPanelPosition)).current;

  // Adjust panel position based on toolbar adjustment
  const controlPanelStyle = {
    marginLeft:
      !toolBarAdjustment && isLandscape
        ? width * 0.08
        : !toolBarAdjustment && !isLandscape
        ? width * 0.14
        : 0,
  };

  // Set colors based on dark mode
  const backgroundColor = darkMode ? '#1a1a1a' : '#fff';
  const buttonTextColor = darkMode ? '#fff' : '#000';

  // Animate panel position when control bar adjustment changes
  useEffect(() => {
    const targetPosition = controlBarAdjustment
      ? height - CONTROL_PANEL_HEIGHT
      : height * 0.05;

    Animated.spring(position, {
      toValue: targetPosition,
      useNativeDriver: false,
    }).start();

    setControlPanelPosition(targetPosition);
  }, [controlBarAdjustment, height, width]);

  // Define control buttons with their properties
  const buttons = [
    {
      title: 'Speaker',
      icon: require('../../assets/logos/speaker.png'),
      onPress: () => {
        setSpeakerVolume((speakerVolume + 10) % 110);
        setSelectedButton('Speaker');
      },
    },
    {
      title: 'Ch Vol',
      icon: require('../../assets/logos/volume-adjustment.png'),
      onPress: () => {
        setSelectedButton('Ch Vol');
        selectedChannel
          ? alert(`Adjusting volume for ${selectedChannel}`)
          : alert('Please select a channel first');
      },
    },
    {
      title: 'Mute All',
      icon: require('../../assets/logos/mute.png'),
      onPress: () => {
        setSpeakerVolume(0);
        setSelectedButton('Mute All');
      },
    },
    {
      title: 'Settings',
      icon: require('../../assets/logos/settings.png'),
      onPress: () => {
        setSelectedButton('Settings');
        navigation.navigate('Settings');
      },
    },
  ];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: CONTROL_PANEL_WIDTH,
          height: CONTROL_PANEL_HEIGHT,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: {width: 0, height: 2},
          shadowRadius: 6,
          elevation: 6,
          paddingHorizontal: 10,
          paddingVertical: 10,
          overflow: 'visible',
          transform: [{translateY: position}],
        },
        controlPanelStyle,
      ]}>
      {/* Render each control button */}
      {buttons.map((btn, index) => (
        <ControlButton
          key={btn.title}
          title={btn.title}
          icon={btn.icon}
          onPress={btn.onPress}
          darkMode={darkMode}
          textColor={buttonTextColor}
          isSelected={selectedButton === btn.title}
          height={height}
          width={width}
        />
      ))}
    </Animated.View>
  );
};

export default ControlPanel;
