// Updated SettingsContext.js
import React, {createContext, useContext, useState} from 'react';
import {Dimensions} from 'react-native';

// Create Context
const SettingsContext = createContext();
const {width, height} = Dimensions.get('window');
const NAV_PANEL_WIDTH = width * 0.08;
const CONTROL_PANEL_HEIGHT = height * 0.1;

// Provider Component
export const SettingsProvider = ({children}) => {
  const [showFrequency, setShowFrequency] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [toolBarAdjustment, setToolBarAdjustment] = useState(true);
  const [controlBarAdjustment, setControlBarAdjustment] = useState(true);
  const [navPanelPosition, setNavPanelPosition] = useState(
    width - NAV_PANEL_WIDTH,
  );
  const [controlPanelPosition, setControlPanelPosition] = useState(
    height - CONTROL_PANEL_HEIGHT,
  );

  // Brightness: 0 (dark) -> 1 (light)
  const [brightness, setBrightness] = useState(1);
  const [darkMode, setDarkMode] = useState(true);

  // Multi-channel listening settings
  const [maxSimultaneousChannels, setMaxSimultaneousChannels] = useState(5);
  const [currentListeningChannels, setCurrentListeningChannels] = useState([]);
  const [currentTalkingChannel, setCurrentTalkingChannel] = useState(null);

  // Multi-channel management methods
  const addListeningChannel = channelId => {
    setCurrentListeningChannels(prev => {
      // Don't add if already listening
      if (prev.includes(channelId)) return prev;

      // Don't add if at limit
      if (prev.length >= maxSimultaneousChannels) return prev;

      return [...prev, channelId];
    });
  };

  const removeListeningChannel = channelId => {
    setCurrentListeningChannels(prev => prev.filter(id => id !== channelId));

    // If this was the talking channel, clear talking state
    if (currentTalkingChannel === channelId) {
      setCurrentTalkingChannel(null);
    }
  };

  const setTalkingChannel = channelId => {
    // Only allow if channel is in listening list
    if (currentListeningChannels.includes(channelId)) {
      setCurrentTalkingChannel(channelId);
    }
  };

  const clearTalkingChannel = () => {
    setCurrentTalkingChannel(null);
  };

  const switchTalkingChannel = newTalkingChannelId => {
    // Only allow if new channel is in listening list
    if (currentListeningChannels.includes(newTalkingChannelId)) {
      setCurrentTalkingChannel(newTalkingChannelId);
      return true;
    }
    return false;
  };

  const getListeningCount = () => {
    return currentListeningChannels.length;
  };

  const canAddMoreChannels = () => {
    return currentListeningChannels.length < maxSimultaneousChannels;
  };

  const isChannelListening = channelId => {
    return currentListeningChannels.includes(channelId);
  };

  const isChannelTalking = channelId => {
    return currentTalkingChannel === channelId;
  };

  const getListeningChannels = () => {
    return [...currentListeningChannels];
  };

  const clearAllChannels = () => {
    setCurrentListeningChannels([]);
    setCurrentTalkingChannel(null);
  };

  return (
    <SettingsContext.Provider
      value={{
        showFrequency,
        setShowFrequency,
        showStatus,
        setShowStatus,
        toolBarAdjustment,
        setToolBarAdjustment,
        controlBarAdjustment,
        setControlBarAdjustment,
        navPanelPosition,
        setNavPanelPosition,
        controlPanelPosition,
        setControlPanelPosition,
        brightness,
        setBrightness,
        darkMode,
        setDarkMode,
        // Multi-channel settings
        maxSimultaneousChannels,
        setMaxSimultaneousChannels,
        currentListeningChannels,
        currentTalkingChannel,
        addListeningChannel,
        removeListeningChannel,
        setTalkingChannel,
        clearTalkingChannel,
        switchTalkingChannel,
        getListeningCount,
        canAddMoreChannels,
        isChannelListening,
        isChannelTalking,
        getListeningChannels,
        clearAllChannels,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
