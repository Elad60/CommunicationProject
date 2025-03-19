// src/screens/SettingsScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AppLayout from '../components/AppLayout';

const SettingsScreen = ({navigation}) => {
  // Settings state
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoConnect: false,
    saveTransmissions: true,
    lowPowerMode: false,
    ToolBarAdjustment:false,
    showFrequency: true,
    showStatus: true,
  });

  const toggleSetting = key => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // Render a setting item with a toggle switch
  const renderSettingItem = (label, key) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        trackColor={{false: '#767577', true: '#0066cc'}}
        thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => toggleSetting(key)}
        value={settings[key]}
      />
    </View>
  );

  return (
    <AppLayout navigation={navigation} title="Settings">
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Settings</Text>
          {renderSettingItem('Dark Mode', 'darkMode')}
          {renderSettingItem('Show Frequency', 'showFrequency')}
          {renderSettingItem('Show Status', 'showStatus')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Radio Settings</Text>
          {renderSettingItem('Notifications', 'notifications')}
          {renderSettingItem('Auto-Connect', 'autoConnect')}
          {renderSettingItem('Save Transmissions', 'saveTransmissions')}
          {renderSettingItem('Low Power Mode', 'lowPowerMode')}
          {renderSettingItem('Tool Bar Adjustment', 'ToolBarAdjustment')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
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
          <Text style={styles.versionText}>Communication System v1.0.0</Text>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
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
    color: '#777',
    fontSize: 14,
  },
});

export default SettingsScreen;
