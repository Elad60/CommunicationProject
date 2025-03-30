// Updated SettingsContext.js
import React, { createContext, useContext, useState } from 'react';
import { Dimensions } from 'react-native';

// Create Context
const SettingsContext = createContext();
const { width, height } = Dimensions.get('window');
const NAV_PANEL_WIDTH = width * 0.08;
const CONTROL_PANEL_HEIGHT = height * 0.1;

// Provider Component
export const SettingsProvider = ({ children }) => {
  const [toolBarAdjustment, setToolBarAdjustment] = useState(true); 
  const [controlBarAdjustment, setControlBarAdjustment] = useState(true); 
  const [navPanelPosition, setNavPanelPosition] = useState(width - NAV_PANEL_WIDTH);
  const [controlPanelPosition, setControlPanelPosition] = useState(height - CONTROL_PANEL_HEIGHT);

  return (
    <SettingsContext.Provider
      value={{
        toolBarAdjustment,
        setToolBarAdjustment,
        controlBarAdjustment,
        setControlBarAdjustment,
        navPanelPosition,
        setNavPanelPosition,
        controlPanelPosition,
        setControlPanelPosition,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom Hook for Easy Access
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
