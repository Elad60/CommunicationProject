import React, { createContext, useContext, useState } from 'react';
import { Dimensions } from 'react-native';

// Create the settings context
const SettingsContext = createContext();

const { width, height } = Dimensions.get('window');
const NAV_PANEL_WIDTH = width * 0.08;
const CONTROL_PANEL_HEIGHT = height * 0.1;

export const SettingsProvider = ({ children }) => {
  // Toggle whether to show channel frequency
  const [showFrequency, setShowFrequency] = useState(true);

  // Toggle whether to show channel status ("Active" / "Not used")
  const [showStatus, setShowStatus] = useState(true);

  // Whether the navigation panel should float or be offset
  const [toolBarAdjustment, setToolBarAdjustment] = useState(true);

  // Whether the control bar is pushed to the bottom or floats
  const [controlBarAdjustment, setControlBarAdjustment] = useState(true);

  // Dynamic nav panel X position (used in animation)
  const [navPanelPosition, setNavPanelPosition] = useState(width - NAV_PANEL_WIDTH);

  // Dynamic control panel Y position (used in animation)
  const [controlPanelPosition, setControlPanelPosition] = useState(height - CONTROL_PANEL_HEIGHT);

  // Brightness level from 0 (dark) to 1 (bright)
  const [brightness, setBrightness] = useState(1);

  // Toggle between dark mode and light mode
  const [darkMode, setDarkMode] = useState(true);

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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to access the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
