import React, {useRef, useEffect} from 'react';
import {Animated, Dimensions} from 'react-native';
import ControlButton from './ControlButton';
import {useSettings} from '../context/SettingsContext';

const {height, width} = Dimensions.get('window');
const CONTROL_PANEL_HEIGHT = 80;

const ControlPanel = ({
  speakerVolume,
  setSpeakerVolume,
  brightness,
  setBrightness,
  selectedChannel,
  navigation,
}) => {
  const {
    controlBarAdjustment,
    controlPanelPosition,
    setControlPanelPosition,
    toolBarAdjustment,
  } = useSettings();
  const position = useRef(new Animated.Value(controlPanelPosition)).current;

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
          width: width,
          height: CONTROL_PANEL_HEIGHT,
          backgroundColor: '#000000',
          flexDirection: 'row',
          bottom: 0,
        },
      ]}>
      <ControlButton
        title="Speaker"
        icon="🔊"
        value={speakerVolume}
        onPress={() => setSpeakerVolume((speakerVolume + 10) % 110)}
      />
      <ControlButton
        title="Ch Vol"
        icon="🎚️"
        onPress={() =>
          selectedChannel
            ? alert(`Adjusting volume for ${selectedChannel}`)
            : alert('Please select a channel first')
        }
      />
      <ControlButton
        title="Bright"
        icon="☀️"
        value={brightness}
        onPress={() => setBrightness((brightness + 20) % 120)}
      />
      <ControlButton
        title="Mute All"
        icon="🔇"
        onPress={() => setSpeakerVolume(0)}
      />
      <ControlButton
        title="Settings"
        icon="⚙️"
        onPress={() => navigation.navigate('Settings')}
      />
    </Animated.View>
  );
};

export default ControlPanel;
