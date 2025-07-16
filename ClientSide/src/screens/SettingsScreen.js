import React, {useState} from 'react';
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
import {useSettings} from '../context/SettingsContext';
import StyledButton from '../components/StyledButton';

const SettingsScreen = ({navigation}) => {
  // Destructure settings values and setters from the context
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
    showMode,
    setShowMode,
  } = useSettings();

  // Toggle setting value for switches
  const toggleSetting = key => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // Set text and button colors based on dark mode
  const textColor = darkMode ? '#fff' : '#000';
  const buttonColor = darkMode ? '#0066cc' : '#91aad4';

  // Render setting item with label, switch, and handler for toggling
  const renderSettingItem = (label, key, value, onToggle) => (
    <View style={styles.settingItem}>
      <Text style={[styles.settingLabel, {color: textColor}]}>{label}</Text>
      <Switch
        trackColor={{false: '#bdbdbd', true: '#90caf9'}}
        thumbColor={value ? '#607D8B' : '#4CAF50'}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <AppLayout navigation={navigation} title="Settings">
      <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
          {/* Display Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              Display Settings
            </Text>
            {renderSettingItem('Show Mode', 'showMode', showMode, () =>
              setShowMode(!showMode),
            )}
            {renderSettingItem('Show Status', 'showStatus', showStatus, () =>
              setShowStatus(!showStatus),
            )}
          </View>

          {/* Radio Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              Radio Settings
            </Text>
            {renderSettingItem(
              'Nav Bar Adjustment ↔️',
              'ToolBarAdjustment',
              toolBarAdjustment,
              () => setToolBarAdjustment(!toolBarAdjustment),
            )}
            {renderSettingItem(
              'Control Bar Adjustment ↕️',
              'controlBarAdjustment',
              controlBarAdjustment,
              () => setControlBarAdjustment(!controlBarAdjustment),
            )}
            {renderSettingItem('Dark Mode 🌗', 'darkMode', darkMode, () =>
              setDarkMode(!darkMode),
            )}
            <CustomSlider
              value={brightness}
              onValueChange={setBrightness}
              label="Brightness ☀️"
              darkMode={darkMode}
            />
          </View>

          {/* System Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              System
            </Text>
            {/* Button to reset all settings */}
            <StyledButton
              onPress={() => {
                setToolBarAdjustment(true);
                setControlBarAdjustment(true);
                setDarkMode(true);
                setBrightness(1);
              }}
              darkMode={darkMode}
              style={{marginVertical: 8, minWidth: 160}}>
              Reset All Settings
            </StyledButton>
            <StyledButton
              onPress={() =>
                Linking.openURL(
                  'https://github.com/Elad60/CommunicationProject',
                )
              }
              darkMode={darkMode}
              style={{marginVertical: 8, minWidth: 160}}>
              Check for Updates
            </StyledButton>
          </View>

          {/* Version Info Section */}
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, {color: textColor}]}>
              Communication System v1.0.0
            </Text>
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
