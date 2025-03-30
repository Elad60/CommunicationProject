import React, { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import ControlButton from './ControlButton';
import { useSettings } from '../context/SettingsContext';

const { height, width } = Dimensions.get('window');
const CONTROL_PANEL_HEIGHT = height * 0.1;
const CONTROL_PANEL_WIDTH = width * 0.92;

const ControlPanel = ({ speakerVolume, setSpeakerVolume, brightness, setBrightness, selectedChannel, navigation }) => {
  const { toolBarAdjustment, controlPanelPosition, setControlPanelPosition } = useSettings();
  const position = useRef(new Animated.Value(controlPanelPosition)).current;
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    position.setValue(controlPanelPosition);
  }, [controlPanelPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => toolBarAdjustment,
      onMoveShouldSetPanResponder: () => toolBarAdjustment,
      onPanResponderGrant: (_, gestureState) => {
        setDragging(true);
        setStartY(gestureState.moveY);
      },
      onPanResponderMove: (_, gestureState) => {
        let newY = gestureState.moveY - CONTROL_PANEL_HEIGHT / 2;
        newY = Math.max(0, Math.min(newY, height - CONTROL_PANEL_HEIGHT));
        position.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        setDragging(false);
        const movementThreshold = 10;
        const movedDistance = Math.abs(gestureState.moveY - startY);
        if (movedDistance < movementThreshold) {
          return;
        }

        const middleScreen = (height / 2) + height * 0.05;
        const finalY = gestureState.moveY < middleScreen ? height * 0.05 : height - CONTROL_PANEL_HEIGHT;

        setControlPanelPosition(finalY);
        Animated.spring(position, {
          toValue: finalY,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: CONTROL_PANEL_WIDTH,
        height: CONTROL_PANEL_HEIGHT,
        backgroundColor: '#111',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        transform: [{ translateY: position }],
        opacity: dragging ? 0.8 : 1,
      }}
      {...panResponder.panHandlers}
    >
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
      <ControlButton title="Mute All" icon="🔇" onPress={() => setSpeakerVolume(0)} />
      <ControlButton title="Settings" icon="⚙️" onPress={() => navigation.navigate('Settings')} />
    </Animated.View>
  );
};

export default ControlPanel;
