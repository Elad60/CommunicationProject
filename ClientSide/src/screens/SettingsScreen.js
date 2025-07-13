import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  Alert,
} from 'react-native';
import CustomSlider from '../components/CustomSlider';
import AppLayout from '../components/AppLayout';
import {useSettings} from '../context/SettingsContext';
import {useVoice} from '../context/VoiceContext';

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
    maxSimultaneousChannels,
    setMaxSimultaneousChannels,
    getListeningCount,
  } = useSettings();

  // Voice context for global voice status
  const {
    isVoiceInitialized,
    activeChannels,
    currentTalkingChannel,
    voiceStatus,
    getActiveChannelsCount,
  } = useVoice();

  // Animation values for the channel picker
  const [scaleAnim] = useState(new Animated.Value(1));

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
  const selectedButtonColor = darkMode ? '#00ff88' : '#4CAF50';

  // Handle channel number selection with animation
  const handleChannelSelection = number => {
    // Animate the button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if we're reducing the limit and have active connections
    const currentListeningCount = getListeningCount();
    if (number < maxSimultaneousChannels && currentListeningCount > number) {
      Alert.alert(
        'Cannot Reduce Channel Limit',
        `You currently have ${currentListeningCount} active channels. Please disconnect from some channels before reducing the limit to ${number}.`,
        [{text: 'OK'}],
      );
    } else {
      setMaxSimultaneousChannels(number);
    }
  };

  // Render channel number button
  const renderChannelButton = number => {
    const isSelected = maxSimultaneousChannels === number;
    const backgroundColor = isSelected ? selectedButtonColor : buttonColor;

    return (
      <TouchableOpacity
        key={number}
        style={[
          styles.channelButton,
          {backgroundColor},
          isSelected && styles.selectedChannelButton,
        ]}
        onPress={() => handleChannelSelection(number)}>
        <Text
          style={[
            styles.channelButtonText,
            {color: isSelected ? '#000' : textColor},
          ]}>
          {number}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render setting item with label, switch, and handler for toggling
  const renderSettingItem = (label, key, value, onToggle) => (
    <View style={styles.settingItem}>
      <Text style={[styles.settingLabel, {color: textColor}]}>{label}</Text>
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
      <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
          {/* Display Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              Display Settings
            </Text>
            {renderSettingItem(
              'Show Frequency',
              'showFrequency',
              showFrequency,
              () => setShowFrequency(!showFrequency),
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

          {/* Voice Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              Voice Settings
            </Text>

            {/* Voice Status */}
            <View style={styles.voiceStatusContainer}>
              <Text style={[styles.voiceStatusLabel, {color: textColor}]}>
                Voice System Status 🎤
              </Text>
              <View style={styles.voiceStatusInfo}>
                <Text style={[styles.voiceStatusText, {color: textColor}]}>
                  Status:{' '}
                  {isVoiceInitialized ? '✅ Initialized' : '❌ Not Initialized'}
                </Text>
                <Text style={[styles.voiceStatusText, {color: textColor}]}>
                  Connection: {voiceStatus}
                </Text>
                <Text style={[styles.voiceStatusText, {color: textColor}]}>
                  Active Channels: {getActiveChannelsCount()}
                </Text>
                {currentTalkingChannel && (
                  <Text style={[styles.voiceStatusText, {color: textColor}]}>
                    Talking on: Channel {currentTalkingChannel}
                  </Text>
                )}
              </View>
            </View>

            {/* Channel Number Picker */}
            <View style={styles.channelPickerContainer}>
              <Text style={[styles.channelPickerLabel, {color: textColor}]}>
                Max Simultaneous Channels 🎧
              </Text>
              <Text style={[styles.channelPickerSubtitle, {color: textColor}]}>
                Select how many channels you can listen to at once
              </Text>

              <View style={styles.channelButtonsContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(renderChannelButton)}
              </View>

              <View style={styles.channelInfo}>
                <Text style={[styles.channelInfoText, {color: textColor}]}>
                  Current Limit: {maxSimultaneousChannels}/10 channels
                </Text>
                <Text style={[styles.voiceStatusSubtext, {color: textColor}]}>
                  {maxSimultaneousChannels === 1
                    ? 'Single channel mode'
                    : maxSimultaneousChannels <= 3
                    ? 'Multi-channel mode'
                    : maxSimultaneousChannels <= 5
                    ? 'Advanced multi-channel mode'
                    : 'Professional multi-channel mode'}
                </Text>
              </View>
            </View>
          </View>

          {/* System Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>
              System
            </Text>
            {/* Button to reset all settings */}
            <TouchableOpacity
              style={[styles.button, {backgroundColor: buttonColor}]}
              onPress={() => {
                setToolBarAdjustment(true);
                setControlBarAdjustment(true);
                setDarkMode(true);
                setBrightness(1);
                setMaxSimultaneousChannels(5);
              }}>
              <Text style={[styles.buttonText, {color: textColor}]}>
                Reset All Settings
              </Text>
            </TouchableOpacity>

            {/* Button to check for updates */}
            <TouchableOpacity
              style={[styles.button, {backgroundColor: buttonColor}]}
              onPress={() =>
                Linking.openURL(
                  'https://github.com/Elad60/CommunicationProject',
                )
              }>
              <Text style={[styles.buttonText, {color: textColor}]}>
                Check for Updates
              </Text>
            </TouchableOpacity>
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
  // New styles for channel picker
  channelPickerContainer: {
    marginVertical: 15,
  },
  channelPickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  channelPickerSubtitle: {
    fontSize: 12,
    marginBottom: 15,
    opacity: 0.7,
  },
  channelButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  channelButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    marginVertical: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedChannelButton: {
    elevation: 8,
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    transform: [{scale: 1.1}],
  },
  channelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  channelInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  channelInfoSubtext: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  // Voice status styles
  voiceStatusContainer: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  voiceStatusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  voiceStatusInfo: {
    gap: 5,
  },
  voiceStatusText: {
    fontSize: 14,
    marginBottom: 2,
  },
  voiceStatusSubtext: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default SettingsScreen;
