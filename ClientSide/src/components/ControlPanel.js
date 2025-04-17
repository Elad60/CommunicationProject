import React, {useRef, useEffect, useState} from 'react';
import {Animated, Dimensions} from 'react-native';
import ControlButton from './ControlButton';
import {useSettings} from '../context/SettingsContext';

const {height, width} = Dimensions.get('window');
const CONTROL_PANEL_HEIGHT = height * 0.13;
const CONTROL_PANEL_WIDTH = width * 0.32;

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
    left: (width - CONTROL_PANEL_WIDTH) / 2-10,
  };

  const backgroundColor = darkMode ? '#1a1a1a' : '#fff';
  const buttonTextColor = darkMode ? '#fff' : '#000';

  useEffect(() => {
    const targetPosition = controlBarAdjustment
      ? height - CONTROL_PANEL_HEIGHT
      : height * 0.05;

    Animated.spring(position, {
      toValue: targetPosition,
      useNativeDriver: false,
    }).start();

    setControlPanelPosition(targetPosition);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          justifyContent: 'center', // ✅ Center buttons
          alignItems: 'center',
          backgroundColor,
          borderRadius: 20,
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
      {buttons.map((btn, index) => (
        <ControlButton
          key={btn.title}
          title={btn.title}
          icon={btn.icon}
          onPress={btn.onPress}
          darkMode={darkMode}
          textColor={buttonTextColor}
          isSelected={selectedButton === btn.title}
        />
      ))}
    </Animated.View>
  );
};

export default ControlPanel;
