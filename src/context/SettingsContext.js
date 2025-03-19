import React, { createContext, useContext, useState } from 'react';

// Create Context
const SettingsContext = createContext();

// Provider Component
export const SettingsProvider = ({ children }) => {
  const [toolBarAdjustment, setToolBarAdjustment] = useState(false); // Default: false

  return (
    <SettingsContext.Provider value={{ toolBarAdjustment, setToolBarAdjustment }}>
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
