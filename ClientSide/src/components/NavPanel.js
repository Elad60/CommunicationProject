import React, {useEffect, useRef} from 'react';
import {Alert, Animated, Dimensions} from 'react-native';
import {useRoute} from '@react-navigation/native'; // NEW
import NavButton from './NavButton';
import {useSettings} from '../context/SettingsContext';
import {useAuth} from '../context/AuthContext';

const {width, height} = Dimensions.get('window');
const PANEL_WIDTH = width * 0.08;
const PANEL_HEIGHT = height * 0.9;

const NavPanel = ({handleNavigation, darkMode}) => {
  const {toolBarAdjustment, controlBarAdjustment} = useSettings();
  const {user} = useAuth();
  const route = useRoute(); // NEW
  const currentScreen = route.name; // NEW

  const positionX = useRef(
    new Animated.Value(toolBarAdjustment ? width - PANEL_WIDTH : -PANEL_WIDTH),
  ).current;

  useEffect(() => {
    Animated.spring(positionX, {
      toValue: toolBarAdjustment ? width - PANEL_WIDTH : -PANEL_WIDTH,
      useNativeDriver: false,
    }).start();
  }, [toolBarAdjustment]);

  const panelStyle = {
    position: 'absolute',
    top: 0,
    bottom: controlBarAdjustment ? -height * 0.1 : 0,
    width: PANEL_WIDTH,
    height: height-30,
    backgroundColor: darkMode ? '#1a1a1a' : '#fff',
    borderRadius: 20,
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
      {buttons.map(({title, icon, screen, roles}) => {
        const allowed = !roles || roles.includes(user?.role);
        return (
          <NavButton
            key={screen}
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
          />
        );
      })}
    </Animated.View>
  );
};

export default NavPanel;
