import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ControlPanel from './ControlPanel';
import NavPanel from './NavPanel';
import { useSettings } from '../context/SettingsContext'; 

const { height, width } = Dimensions.get('window');

const AppLayout = ({ children, navigation, title, showControls = true, showNavPanel = true }) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [activeNav, setActiveNav] = useState('radios');
  const { user, logout } = useAuth();
  const { controlBarAdjustment, toolBarAdjustment } = useSettings();  // Get control and toolbar adjustment values

  // Handle navigation between screens
  const handleNavigation = screen => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const contentContainerStyle = {
    marginTop: controlBarAdjustment ? 0 : height * 0.1, 
    marginLeft: toolBarAdjustment ? 0 : width * 0.08,  
  };

  return (
    <View style={styles.container}>
      {/* Top header section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{title || 'Communication System'}</Text>
        {user && <Text style={styles.userInfo}>Logged in as: {user.username}</Text>}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main content area */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}

        {/* Right navigation panel */}
        {showNavPanel && <NavPanel activeNav={activeNav} handleNavigation={handleNavigation} />}
      </View>

      {/* Bottom control panel */}
      {showControls && (
        <ControlPanel
          speakerVolume={speakerVolume}
          setSpeakerVolume={setSpeakerVolume}
          brightness={brightness}
          setBrightness={setBrightness}
          navigation={navigation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: height * 0.05,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    color: '#aaa',
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
