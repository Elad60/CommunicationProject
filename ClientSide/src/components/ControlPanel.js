/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-alert */
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
  // Determine layout orientation and panel dimensions
  let CONTROL_PANEL_HEIGHT;
  let CONTROL_PANEL_WIDTH;
  const isLandscape = height < width;

  // Responsive sizing for control panel based on orientation
  if (isLandscape) {
    CONTROL_PANEL_HEIGHT = height * 0.13;
    CONTROL_PANEL_WIDTH = width * 0.92;
  } else {
    CONTROL_PANEL_HEIGHT = height * 0.1;
    CONTROL_PANEL_WIDTH = width * 0.86;
  }

  const [selectedButton, setSelectedButton] = useState(null);

  // Extract settings context values
  const {
    controlBarAdjustment,
    controlPanelPosition,
    setControlPanelPosition,
    toolBarAdjustment,
  } = useSettings();

  const position = useRef(new Animated.Value(controlPanelPosition)).current;

  // Adjust horizontal margin if toolbar is not adjusted
  const controlPanelStyle = {
    marginLeft:
      !toolBarAdjustment && isLandscape
        ? width * 0.08
        : !toolBarAdjustment && !isLandscape
        ? width * 0.14
        : 0,
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#fff';
  const buttonTextColor = darkMode ? '#fff' : '#000';

  // Animate panel position based on control bar toggle
  useEffect(() => {
    // Animate control panel vertical position
    const targetPosition = controlBarAdjustment
      ? height - CONTROL_PANEL_HEIGHT // Bottom of screen
      : height * 0.05; // Just below header

    Animated.spring(position, {
      toValue: targetPosition,
      useNativeDriver: false,
    }).start();

    setControlPanelPosition(targetPosition);
  }, [controlBarAdjustment, height, width]);

  // Define control buttons with behavior
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

  // Render animated control panel with buttons
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
          transform: [{translateY: position}], // Animate vertical position
        },
        controlPanelStyle,
      ]}>
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
