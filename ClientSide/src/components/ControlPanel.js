import React, {useRef, useEffect} from 'react';
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

  // Dark mode background color for control panel
  const backgroundColor = darkMode ? '#333' : '#e0e0e0';
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
  }, [controlBarAdjustment]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: CONTROL_PANEL_WIDTH,
          height: CONTROL_PANEL_HEIGHT,
          backgroundColor,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          transform: [{translateY: position}],
        },
        controlPanelStyle,
      ]}>
      <ControlButton
        title="Speaker"
        icon={require('../../assets/logos/speaker.png')}
        value={speakerVolume}
        textColor={buttonTextColor} // Pass textColor to ControlButton
        darkMode={darkMode}
        onPress={() => setSpeakerVolume((speakerVolume + 10) % 110)}
      />
      <ControlButton
        title="Ch Vol"
        icon={require('../../assets/logos/volume-adjustment.png')}
        textColor={buttonTextColor} // Pass textColor to ControlButton
        darkMode={darkMode}
        onPress={() =>
          selectedChannel
            ? alert(`Adjusting volume for ${selectedChannel}`)
            : alert('Please select a channel first')
        }
      />
      <ControlButton
        title="Mute All"
        icon={require('../../assets/logos/mute.png')}
        textColor={buttonTextColor} // Pass textColor to ControlButton
        darkMode={darkMode}
        onPress={() => setSpeakerVolume(0)}
      />
      <ControlButton
        title="Settings"
        icon={require('../../assets/logos/settings.png')}
        textColor={buttonTextColor} // Pass textColor to ControlButton
        darkMode={darkMode}
        onPress={() => navigation.navigate('Settings')}
      />
    </Animated.View>
  );
};

export default ControlPanel;
