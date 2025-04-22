import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import CustomSlider from '../components/CustomSlider'; 
import AppLayout from '../components/AppLayout';
import { useSettings } from '../context/SettingsContext';

const SettingsScreen = ({ navigation }) => {
  // Access global settings from context
  const {
    showFrequency,
    setShowFrequency,
    showStatus,
    setShowStatus,
    toolBarAdjustment,
    setToolBarAdjustment,
    controlBarAdjustment,
    setControlBarAdjustment,
    brightness,
    setBrightness,
    darkMode,
    setDarkMode,
  } = useSettings();

  // Local-only settings (not stored globally)
  const [settings, setSettings] = useState({
    notifications: true,
    autoConnect: false,
    saveTransmissions: true,
    lowPowerMode: false,
  });

  // Toggle local setting
  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const textColor = darkMode ? '#fff' : '#000';
  const buttonColor = darkMode ? '#0066cc' : '#91aad4';

  // Generic setting item renderer
  const renderSettingItem = (label, key, value, onToggle) => (
    <View style={styles.settingItem}>
      <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
      <Switch
        trackColor={{
            false: darkMode ? '#444' : '#767577', 
            true: buttonColor, 
        }}
        thumbColor={darkMode ? '#fff' : '#000'}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <AppLayout navigation={navigation} title="Settings">
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container}>

          {/* Display Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Display Settings</Text>
            {renderSettingItem('Show Frequency', 'showFrequency', showFrequency, () => setShowFrequency(!showFrequency))}
            {renderSettingItem('Show Status', 'showStatus', showStatus, () => setShowStatus(!showStatus))}
          </View>

          {/* Radio & UI Behavior Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Radio Settings</Text>
            {renderSettingItem('Notifications', 'notifications', settings.notifications, () => toggleSetting('notifications'))}
            {renderSettingItem('Auto-Connect', 'autoConnect', settings.autoConnect, () => toggleSetting('autoConnect'))}
            {renderSettingItem('Save Transmissions', 'saveTransmissions', settings.saveTransmissions, () => toggleSetting('saveTransmissions'))}
            {renderSettingItem('Low Power Mode', 'lowPowerMode', settings.lowPowerMode, () => toggleSetting('lowPowerMode'))}
            {renderSettingItem('Nav Bar Adjustment ↔️', 'ToolBarAdjustment', toolBarAdjustment, () => setToolBarAdjustment(!toolBarAdjustment))}
            {renderSettingItem('Control Bar Adjustment ↕️', 'controlBarAdjustment', controlBarAdjustment, () => setControlBarAdjustment(!controlBarAdjustment))}
            {renderSettingItem('Dark Mode 🌗', 'darkMode', darkMode, () => setDarkMode(!darkMode))}

            {/* Brightness Slider */}
            <CustomSlider
              value={brightness}
              onValueChange={setBrightness}
              label="Brightness ☀️"
              darkMode={darkMode}
            />
          </View>

          {/* System Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>System</Text>

            {/* Reset all global settings to defaults */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonColor }]}
              onPress={() => {
                setToolBarAdjustment(true);
                setControlBarAdjustment(true);
                setDarkMode(true);
                setBrightness(1);
              }}>
              <Text style={[styles.buttonText, { color: textColor }]}>Reset All Settings</Text>
            </TouchableOpacity>

            {/* Link to GitHub (simulate update check) */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonColor }]}
              onPress={() => Linking.openURL('https://github.com/Elad60/CommunicationProject')}>
              <Text style={[styles.buttonText, { color: textColor }]}>Check for Updates</Text>
            </TouchableOpacity>
          </View>

          {/* Version Info */}
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, { color: textColor }]}>Communication System v1.0.0</Text>
          </View>
        </ScrollView>    
      </View>
    </AppLayout>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionInfo: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
  },
});

export default SettingsScreen;
