/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-alert */
import React, {useRef, useEffect, useState} from 'react';
import {Animated} from 'react-native';
import ControlButton from './ControlButton';
import {useSettings} from '../context/SettingsContext';
import {useVoice} from '../context/VoiceContext';
import VolumeModal from './VolumeModal';
import {NativeModules} from 'react-native';

const {AgoraModule} = NativeModules;

const ControlPanel = ({
  speakerVolume,
  setSpeakerVolume,
  navigation,
  darkMode,
  height,
  width,
  onShowInstructions,
}) => {
  // Determine layout orientation and panel dimensions
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

  const [selectedButton, setSelectedButton] = useState(null);
  const [channelVolume, setChannelVolume] = useState(1); // 1 = 100%
  const [isMuted, setIsMuted] = useState(false); // NEW
  const [lastVolume, setLastVolume] = useState(1); // NEW, store last non-zero volume

  // Extract settings context values
  const {
    controlBarAdjustment,
    controlPanelPosition,
    setControlPanelPosition,
    toolBarAdjustment,
  } = useSettings();

  const position = useRef(new Animated.Value(controlPanelPosition)).current;
  const controlPanelStyle = {
    marginLeft:
      !toolBarAdjustment && isLandscape
        ? width * 0.08
        : !toolBarAdjustment && !isLandscape
        ? width * 0.14
        : 0,
  };
  const {selectedChannel, setSelectedChannel} = useVoice();
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);

  const backgroundColor = darkMode ? '#1a1a1a' : '#fff';
  const buttonTextColor = darkMode ? '#fff' : '#000';

  // Animate panel position based on control bar toggle
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

  const buttons = [
    // Show volume controls only if NOT in Groups screen (when onShowInstructions is not available)
    ...(!onShowInstructions
      ? [
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
              if (selectedChannel) {
                setSelectedChannelForVolume(selectedChannel);
              } else if (channels && channels.length) {
                const active = channels.find(
                  c =>
                    c.channelState === 'ListenOnly' ||
                    c.channelState === 'ListenAndTalk',
                );
                if (active) {
                  setSelectedChannelForVolume(active.id);
                } else {
                  alert('Please select a channel first');
                }
              } else {
                alert('Please select a channel first');
              }
            },
          },
          {
            title: isMuted ? 'Unmute' : 'Mute',
            icon: require('../../assets/logos/mute.png'),
            onPress: () => {
              setSelectedButton('Mute');
              // Only allow mute if a channel is selected (same logic as Ch Vol)
              let channelSelected = selectedChannel;
              if (!channelSelected && channels && channels.length) {
                const active = channels.find(
                  c =>
                    c.channelState === 'ListenOnly' ||
                    c.channelState === 'ListenAndTalk',
                );
                if (active) channelSelected = active.id;
              }
              if (!channelSelected) {
                alert('Please select a channel first');
                return;
              }
              if (!isMuted) {
                setLastVolume(channelVolume); // Save last volume
                setIsMuted(true);
                setChannelVolume(0);
                if (AgoraModule && AgoraModule.AdjustPlaybackVolume) {
                  AgoraModule.AdjustPlaybackVolume(0);
                }
              } else {
                setIsMuted(false);
                setChannelVolume(lastVolume || 1);
                if (AgoraModule && AgoraModule.AdjustPlaybackVolume) {
                  AgoraModule.AdjustPlaybackVolume(
                    Math.round((lastVolume || 1) * 400),
                  );
                }
              }
            },
          },
        ]
      : []),
    // Add Details button only when onShowInstructions is available (Groups screen)
    ...(onShowInstructions
      ? [
          {
            title: 'Details',
            icon: require('../../assets/logos/announcement.png'),
            onPress: () => {
              setSelectedButton('Details');
              onShowInstructions();
            },
          },
        ]
      : []),
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
    <>
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
      <VolumeModal
        visible={volumeModalVisible}
        initialValue={lastVolume}
        darkMode={darkMode}
        onCancel={() => setVolumeModalVisible(false)}
        onSet={vol => {
          setVolumeModalVisible(false);
          setLastVolume(vol / 400);
          if (
            AgoraModule &&
            typeof AgoraModule.AdjustPlaybackVolume === 'function'
          ) {
            AgoraModule.AdjustPlaybackVolume(vol);
          }
        }}
      />
    </>
  );
};

export default ControlPanel;
