// AppLayout.js
import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import {useDebouncedDimensions} from '../utils/useDebouncedDimensions';
import {useAuth} from '../context/AuthContext';
import ControlPanel from './ControlPanel';
import NavPanel from './NavPanel';
import {useSettings} from '../context/SettingsContext';
import LogoutButton from './LogoutButton';
// import {useIncomingCallListener} from '../hooks/useIncomingCallListener'; // FULLY DISABLED

const AppLayout = ({
  children,
  navigation,
  title,
  showControls = true,
  showNavPanel = true,
  onShowInstructions,
}) => {
  const {height, width} = useDebouncedDimensions(300);
  const isLandscape = width > height;

  // Panel size calculations based on orientation
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
  }, [height, width, isLandscape]);

  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [activeNav, setActiveNav] = useState('radios');

  const {user, logout, changeGroup} = useAuth();
  const {controlBarAdjustment, toolBarAdjustment, brightness, darkMode} =
    useSettings();
  
  // Listen for incoming calls - DISABLED until backend is ready
  // useIncomingCallListener();

  const handleNavigation = screen => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const backgroundColor = darkMode ? '#000' : '#d9d9d9';
  const textColor = darkMode ? '#fff' : '#000';

  // Professional header styling
  const headerBackgroundColor = darkMode ? '#1a1a1a' : '#ffffff';
  const headerShadowColor = darkMode ? '#000000' : '#cccccc';
  const primaryTextColor = darkMode ? '#ffffff' : '#1a1a1a';
  const secondaryTextColor = darkMode ? '#b0b0b0' : '#666666';
  const accentColor = '#2196F3';

  return (
    <View style={[styles.container, {backgroundColor}]}>
      {/* Status Bar */}
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={headerBackgroundColor}
      />

      {/* Enhanced Professional Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: headerBackgroundColor,
            height: Math.max(height * 0.08, 60), // Responsive height with minimum
            shadowColor: headerShadowColor,
          },
        ]}>
        {/* Left Section - App Title/Logo */}
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logos/comm.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
            <View style={styles.titleContainer}>
              <Text style={[styles.appTitle, {color: primaryTextColor}]}>
                {title || 'TechMer'}
              </Text>
              <Text style={[styles.appSubtitle, {color: secondaryTextColor}]}>
                Communication System
              </Text>
            </View>
          </View>
        </View>

        {/* Center Section - User Status */}
        <View style={styles.headerCenter}>
          {user && (
            <View style={styles.userStatusContainer}>

              <View style={styles.userInfoContainer}>
                <Text style={[styles.userName, {color: primaryTextColor}]}>
                  {user.username}
                </Text>
                <Text style={[styles.userRole, {color: secondaryTextColor}]}>
                  Connected • Ready
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Right Section - Actions */}
        <View style={styles.headerRight}>
          <LogoutButton
            darkMode={darkMode}
            onLogout={async () => {
              if (user?.group !== 'A') {
                await changeGroup('A');
              }
              logout(user.id);
            }}
          />
        </View>
      </View>

      {/* Main Content */}
      <View
        style={{
          flex: 1,
          marginTop: controlBarAdjustment ? 0 : CONTROL_PANEL_HEIGHT,
          marginLeft: toolBarAdjustment ? 0 : NAV_PANEL_WIDTH,
          width: CONTROL_PANEL_WIDTH,
          height: isLandscape
            ? NAV_PANEL_HEIGHT + CONTROL_PANEL_HEIGHT
            : NAV_PANEL_HEIGHT - CONTROL_PANEL_HEIGHT / 2,
        }}>
        {children}

        {/* Navigation Panel */}
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

      {/* Control Panel */}
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
          onShowInstructions={onShowInstructions}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  // Left Section - Logo and Title
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    marginTop: 1,
  },
  // Center Section - User Status
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    marginTop: 1,
  },

  // Right Section - Actions
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
});

export default AppLayout;
