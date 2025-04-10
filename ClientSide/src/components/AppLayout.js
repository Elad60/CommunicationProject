import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ControlPanel from './ControlPanel';
import NavPanel from './NavPanel';
import { useSettings } from '../context/SettingsContext';

const { height, width } = Dimensions.get('window');

const AppLayout = ({ children, navigation, title, showControls = true, showNavPanel = true }) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [activeNav, setActiveNav] = useState('radios');

  const { user, logout } = useAuth();

  const { controlBarAdjustment, toolBarAdjustment, brightness, darkMode } = useSettings();

  const handleNavigation = (screen) => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const contentContainerStyle = {
    marginTop: controlBarAdjustment ? 0 : height * 0.1,
    marginLeft: toolBarAdjustment ? 0 : width * 0.08,
  };

  const backgroundColor = darkMode ? '#000' : '#fff';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <Text style={[styles.headerText, { color: textColor }]}>
          {title || 'Communication System'}
        </Text>
        {user && <Text style={[styles.userInfo, { color: textColor }]}>Logged in as: {user.username}</Text>}
        <TouchableOpacity style={styles.logoutButton} onPress={() => logout(user.id)}>
        <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
        {showNavPanel && <NavPanel activeNav={activeNav} handleNavigation={handleNavigation} darkMode={darkMode} />}
      </View>

      {/* Control Panel */}
      {showControls && (
        <ControlPanel
          speakerVolume={speakerVolume}
          setSpeakerVolume={setSpeakerVolume}
          brightness={brightness}
          setBrightness={brightness}
          darkMode={darkMode}
          navigation={navigation}
        />
      )}

      {/* Global Brightness Overlay */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0, 0, 0, ${1 - (brightness * 0.75 + 0.25)})`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: height * 0.05,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#5A5A5A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
  },
  contentContainer: {
    width: width * 0.92,
    height: height * 0.85,
  },
});

export default AppLayout;
