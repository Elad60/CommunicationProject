import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import ControlPanel from './ControlPanel';
import NavPanel from './NavPanel';
import {useSettings} from '../context/SettingsContext';
import LogoutButton from './LogoutButton';

const {height, width} = Dimensions.get('window');

const AppLayout = ({
  children,
  navigation,
  title,
  showControls = true,
  showNavPanel = true,
}) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [activeNav, setActiveNav] = useState('radios');

  const {user, logout, changeGroup} = useAuth();

  const {controlBarAdjustment, toolBarAdjustment, brightness, darkMode} =
    useSettings();

  const handleNavigation = screen => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const contentContainerStyle = {
    marginTop: controlBarAdjustment ? 0 : height * 0.1,
    marginLeft: toolBarAdjustment ? 0 : width * 0.08,
  };

  const backgroundColor = darkMode ? '#000' : '#d9d9d9';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* Header */}
      <View style={[styles.header, {backgroundColor}]}>
        {/* Left - Title */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerText, {color: textColor}]}>
            {title || 'Communication System'}
          </Text>
        </View>

        {/* Center - User info */}
        <View style={[styles.headerSection, styles.centerSection]}>
          {user && (
            <Text style={[styles.userInfo, {color: textColor}]}>
              Logged in as: {user.username}
            </Text>
          )}
        </View>

        {/* Right - Logout button */}
        <View style={[styles.headerSection, {alignItems: 'flex-end'}]}>
          <LogoutButton
            onLogout={async () => {
              if (user?.group !== 'A') {
                await changeGroup('A');
              }
              logout(user.id);
            }}
          />
        </View>
      </View>

      {/* Main content */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
        {showNavPanel && (
          <NavPanel
            activeNav={activeNav}
            handleNavigation={handleNavigation}
            darkMode={darkMode}
          />
        )}
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
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  // שלושת העמודות ב-header
  headerSection: {
    flex: 1,
    justifyContent: 'center',
  },

  centerSection: {
    alignItems: 'center',
  },

  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  userInfo: {
    fontSize: 14,
  },

  contentContainer: {
    width: width * 0.92,
    height: height * 0.85,
  },
});


export default AppLayout;
