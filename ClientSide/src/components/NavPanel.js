import React, { useEffect, useRef } from 'react';
import { Alert, Animated, useWindowDimensions, View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import NavButton from './NavButton';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useAnnouncements } from '../context/AnnouncementsContext'; // הוספת הקונטקסט

const NavPanel = ({ handleNavigation, darkMode }) => {

  const { height, width } = useWindowDimensions();
  let NAV_PANEL_HEIGHT;
  let NAV_PANEL_WIDTH;
  const isLandscape = height < width;
  
  if (isLandscape) {
    NAV_PANEL_HEIGHT = height * 0.7;
    NAV_PANEL_WIDTH = width * 0.08;
  } else {
    NAV_PANEL_HEIGHT = height * 0.9;
    NAV_PANEL_WIDTH = width * 0.14;
  }
  const { toolBarAdjustment, controlBarAdjustment } = useSettings();
  const { user } = useAuth();
  const { unreadCount, fetchUnreadCount } = useAnnouncements(); // שימוש בקונטקסט ההודעות
  const route = useRoute();
  const currentScreen = route.name;

  const positionX = useRef(
    new Animated.Value(toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH),
  ).current;

  useEffect(() => {
    Animated.spring(positionX, {
      toValue: toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH,
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolBarAdjustment, height, width]);

  // טעינת מספר הודעות שלא נקראו בעת טעינת הקומפוננטה
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentScreen]);

  const panelStyle = {
    position: 'absolute',
    top: 0,
    top: controlBarAdjustment ? 0 : isLandscape ? -height * 0.13 : -height * 0.1,
    height: height - 30,
    width: NAV_PANEL_WIDTH,
    backgroundColor: darkMode ? '#1a1a1a' : '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 6,
    transform: [{ translateX: positionX }],
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
      showBadge: unreadCount > 0, // האם להציג תג
      badgeCount: unreadCount, // מספר ההודעות שלא נקראו
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
      {buttons.map(({ title, icon, screen, roles, showBadge, badgeCount }) => {
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
            
            {/* תג מספר הודעות שלא נקראו */}
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

// סגנונות חדשים לתג
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