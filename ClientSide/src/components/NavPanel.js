/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  useWindowDimensions,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import NavButton from './NavButton';
import {useSettings} from '../context/SettingsContext';
import {useAuth} from '../context/AuthContext';
import {useAnnouncements} from '../context/AnnouncementsContext';

const NavPanel = ({handleNavigation, darkMode, height, width}) => {
  let NAV_PANEL_HEIGHT;
  let NAV_PANEL_WIDTH;
  const isLandscape = height < width;

  if (isLandscape) {
    NAV_PANEL_HEIGHT = height * 0.7;
    NAV_PANEL_WIDTH = width * 0.082;
  } else {
    NAV_PANEL_HEIGHT = height * 0.9;
    NAV_PANEL_WIDTH = width * 0.14;
  }

  const {toolBarAdjustment, controlBarAdjustment} = useSettings();
  const {user} = useAuth();
  const {unreadCount, fetchUnreadCount} = useAnnouncements();
  const route = useRoute();
  const currentScreen = route.name;

  // Animate the X position of the panel (slide-in/out)
  const positionX = useRef(
    new Animated.Value(
      toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH,
    ),
  ).current;

  useEffect(() => {
    Animated.spring(positionX, {
      toValue: toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH,
      useNativeDriver: false,
    }).start();
  }, [toolBarAdjustment, height, width]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount(); // Refresh unread badge when screen/user changes
    }
  }, [user, currentScreen]);

  const panelStyle = {
    position: 'absolute',
    top: controlBarAdjustment
      ? 0
      : isLandscape
      ? -height * 0.13
      : -height * 0.1,
    height: height - height * 0.05,
    width: NAV_PANEL_WIDTH,
    backgroundColor: darkMode ? '#1a1a1a' : '#fff',
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    elevation: 6,
    transform: [{translateX: positionX}],
  };

  const buttons = [
    {
      title: 'Radios',
      icon: require('../../assets/logos/radio.png'),
      screen: 'Main',
    },
    {
      title: 'Groups',
      icon: require('../../assets/logos/groups.png'),
      screen: 'Groups',
    },
    {
      title: 'Announcements',
      icon: require('../../assets/logos/announcement.png'),
      screen: 'Announcements',
      showBadge: unreadCount > 0,
      badgeCount: unreadCount,
    },
    {
      title: 'More Radios',
      icon: require('../../assets/logos/radio-plus.png'),
      screen: 'ChannelConfig',
      roles: ['Technician', 'Admin'],
    },
    {
      title: 'Admin Panel',
      icon: require('../../assets/logos/admin-panel.png'),
      screen: 'UserManagement',
      roles: ['Admin'],
    },
  ];

  return (
    <Animated.View style={panelStyle}>
      {buttons.map(({title, icon, screen, roles, showBadge, badgeCount}) => {
        const allowed = !roles || roles.includes(user?.role);

        return (
          <View key={screen} style={styles.buttonContainer}>
            <NavButton
              title={title}
              icon={icon}
              onPress={() => {
                if (allowed) {
                  handleNavigation(screen);
                } else {
                  Alert.alert(
                    'Access Denied',
                    'You are not authorized to access this section.',
                  );
                }
              }}
              isActive={currentScreen === screen}
              darkMode={darkMode}
              height={height}
              width={width}
            />

            {/* Badge for unread announcement count */}
            {showBadge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NavPanel;
