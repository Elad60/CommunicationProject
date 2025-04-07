import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import CustomSlider from '../components/CustomSlider'; 
import AppLayout from '../components/AppLayout';
import { useSettings } from '../context/SettingsContext';

const SettingsScreen = ({ navigation }) => {
  const {
    toolBarAdjustment,
    setToolBarAdjustment,
    controlBarAdjustment,
    setControlBarAdjustment,
    brightness,
    setBrightness,
    darkMode,
    setDarkMode,
  } = useSettings();

  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoConnect: false,
    saveTransmissions: true,
    lowPowerMode: false,
    showFrequency: true,
    showStatus: true,
  });

  const toggleSetting = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const renderSettingItem = (label, key, value, onToggle) => (
    <View style={styles.settingItem}>
      <Text style={[styles.settingLabel, { color: darkMode ? '#fff' : '#000' }]}>{label}</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#0066cc' }}
        thumbColor={darkMode ? '#fff' : '#000'}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  const textColor = darkMode ? '#fff' : '#000';

  return (
    <AppLayout navigation={navigation} title="Settings">
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Display Settings</Text>
            {renderSettingItem('Show Frequency', 'showFrequency', settings.showFrequency, () => toggleSetting('showFrequency'))}
            {renderSettingItem('Show Status', 'showStatus', settings.showStatus, () => toggleSetting('showStatus'))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Radio Settings</Text>
            {renderSettingItem('Notifications', 'notifications', settings.notifications, () => toggleSetting('notifications'))}
            {renderSettingItem('Auto-Connect', 'autoConnect', settings.autoConnect, () => toggleSetting('autoConnect'))}
            {renderSettingItem('Save Transmissions', 'saveTransmissions', settings.saveTransmissions, () => toggleSetting('saveTransmissions'))}
            {renderSettingItem('Low Power Mode', 'lowPowerMode', settings.lowPowerMode, () => toggleSetting('lowPowerMode'))}
            {renderSettingItem('Nav Bar Adjustment ↔️', 'ToolBarAdjustment', toolBarAdjustment, () => setToolBarAdjustment(!toolBarAdjustment))}
            {renderSettingItem('Control Bar Adjustment ↕️', 'controlBarAdjustment', controlBarAdjustment, () => setControlBarAdjustment(!controlBarAdjustment))}
            {renderSettingItem('Dark Mode 🌗', 'darkMode', darkMode, () => setDarkMode(!darkMode))}
            <CustomSlider
              value={brightness}
              onValueChange={setBrightness}
              label="Brightness ☀️"
              darkMode={darkMode}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>System</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Reset All Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Clear Saved Transmissions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Check for Updates</Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 5,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
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
