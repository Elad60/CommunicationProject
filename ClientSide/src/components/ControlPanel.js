// ControlPanel.js
import React, {useRef, useEffect, useState} from 'react';
import {Animated, Dimensions} from 'react-native';
import ControlButton from './ControlButton';
import {useSettings} from '../context/SettingsContext';

const {height, width} = Dimensions.get('window');
const CONTROL_PANEL_HEIGHT = height * 0.1;
const CONTROL_PANEL_WIDTH = width * 0.92;

const ControlPanel = ({
  speakerVolume,
  setSpeakerVolume,
  selectedChannel,
  navigation,
  darkMode,
}) => {
  const [selectedButton, setSelectedButton] = useState(null);

  const {
    controlBarAdjustment,
    controlPanelPosition,
    setControlPanelPosition,
    toolBarAdjustment,
  } = useSettings();
  const position = useRef(new Animated.Value(controlPanelPosition)).current;

  const controlPanelStyle = {
    marginLeft: toolBarAdjustment ? 0 : width * 0.08,
  };

  const backgroundColor = 'black';
  const buttonTextColor = darkMode ? '#fff' : '#fff';

  useEffect(() => {
    const targetPosition = controlBarAdjustment
      ? height - CONTROL_PANEL_HEIGHT
      : height * 0.05;

    Animated.spring(position, {
      toValue: targetPosition,
      useNativeDriver: false,
    }).start();

    setControlPanelPosition(targetPosition);
  }, [controlBarAdjustment]);

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
          transform: [{translateY: position}],
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
          isFirst={index === 0}
          isLast={index === buttons.length - 1}
        />
      ))}
    </Animated.View>
  );
};

export default ControlPanel;
