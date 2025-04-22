/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';
import {useAuth} from '../context/AuthContext';
import ControlPanel from './ControlPanel';
import NavPanel from './NavPanel';
import {useSettings} from '../context/SettingsContext';
import LogoutButton from './LogoutButton';

const AppLayout = ({
  children,
  navigation,
  title,
  showControls = true,
  showNavPanel = true,
}) => {
  // Responsive layout: updates only after resizing stops (debounced)
  const {height, width} = useDebouncedDimensions(300);
  const isLandscape = width > height;

  // Memoized layout dimensions based on orientation
  const {
    NAV_PANEL_WIDTH,
    NAV_PANEL_HEIGHT,
    CONTROL_PANEL_WIDTH,
    CONTROL_PANEL_HEIGHT,
  } = useMemo(() => {
    return {
      NAV_PANEL_WIDTH: isLandscape ? width * 0.08 : width * 0.14,
      NAV_PANEL_HEIGHT: isLandscape ? height * 0.7 : height * 0.9,
      CONTROL_PANEL_WIDTH: isLandscape ? width * 0.92 : width * 0.86,
      CONTROL_PANEL_HEIGHT: isLandscape ? height * 0.13 : height * 0.1,
    };
  }, [height, width]);

  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [activeNav, setActiveNav] = useState('radios');

  const {user, logout, changeGroup} = useAuth();
  const {controlBarAdjustment, toolBarAdjustment, brightness, darkMode} =
    useSettings();

  // Handles screen change when user clicks a nav item
  const handleNavigation = screen => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const backgroundColor = darkMode ? '#000' : '#d9d9d9';
  const textColor = darkMode ? '#fff' : '#000';

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* Top Header Bar */}
      <View style={[styles.header, {backgroundColor, height: height * 0.05}]}>
        <View style={styles.headerSection}>
          <Text style={[styles.headerText, {color: textColor}]}>
            {title || 'Communication System'}
          </Text>
        </View>

        <View style={[styles.headerSection, styles.centerSection]}>
          {user && (
            <Text style={[styles.userInfo, {color: textColor}]}>
              Logged in as: {user.username}
            </Text>
          )}
        </View>

        <View style={[styles.headerSection, {alignItems: 'flex-end'}]}>
          <LogoutButton
            onLogout={async () => {
              // When logging out, always reset to group A
              if (user?.group !== 'A') {
                await changeGroup('A');
              }
              logout(user.id);
            }}
          />
        </View>
      </View>

      {/* Main Application Content */}
      <View
        style={{
          marginTop: controlBarAdjustment ? 0 : CONTROL_PANEL_HEIGHT,
          marginLeft: toolBarAdjustment ? 0 : NAV_PANEL_WIDTH,
          width: CONTROL_PANEL_WIDTH,
          height: isLandscape
            ? NAV_PANEL_HEIGHT + CONTROL_PANEL_HEIGHT
            : NAV_PANEL_HEIGHT - CONTROL_PANEL_HEIGHT / 2,
        }}>
        {children}

        {/* Optional Navigation Panel */}
        {showNavPanel && (
          <NavPanel
            activeNav={activeNav}
            handleNavigation={handleNavigation}
            darkMode={darkMode}
            height={height}
            width={width}
          />
        )}
      </View>

      {/* Optional Control Panel (bottom bar) */}
      {showControls && (
        <ControlPanel
          speakerVolume={speakerVolume}
          setSpeakerVolume={setSpeakerVolume}
          brightness={brightness}
          setBrightness={brightness}
          darkMode={darkMode}
          navigation={navigation}
          height={height}
          width={width}
        />
      )}

      {/* Brightness overlay simulating screen dimming */}
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
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
});

export default AppLayout;
