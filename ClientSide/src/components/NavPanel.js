import React, {useEffect, useRef} from 'react';
import {Alert, Animated, Dimensions} from 'react-native';
import NavButton from './NavButton';
import {useSettings} from '../context/SettingsContext';
import {useAuth} from '../context/AuthContext';

const {width, height} = Dimensions.get('window');
const NAV_PANEL_WIDTH = width * 0.08;
const NAV_PANEL_HEIGHT = height * 0.95;

const NavPanel = ({activeNav, handleNavigation, darkMode}) => {
  const {toolBarAdjustment, controlBarAdjustment} = useSettings();
  const positionX = useRef(
    new Animated.Value(
      toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH,
    ),
  ).current;

  const {user} = useAuth();

  const navPanelStyle = {
    bottom: controlBarAdjustment ? -height * 0.1 : 0,
  };

  const backgroundColor = darkMode ? '#333' : '#e0e0e0'; // Dark mode background color
  const textColor = darkMode ? '#fff' : '#000'; // Dark mode text/icon color

  useEffect(() => {
    Animated.spring(positionX, {
      toValue: toolBarAdjustment ? width - NAV_PANEL_WIDTH : -NAV_PANEL_WIDTH,
      useNativeDriver: false,
    }).start();
  }, [toolBarAdjustment]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          height: NAV_PANEL_HEIGHT,
          width: NAV_PANEL_WIDTH,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'space-around',
          transform: [{translateX: positionX}],
        },
        navPanelStyle,
      ]}>
      {[
        {title: 'Radios', icon: '📻', screen: 'Main'},
        {title: 'Groups', icon: '👥', screen: 'Groups'},
        {title: 'Intercoms', icon: '🔊', screen: 'Intercoms'},
        {title: 'PAS', icon: '📢', screen: 'Pas'},
        {
          title: 'More Radios',
          icon: '📻',
          screen: 'ChannelConfig',
          roles: ['Technician', 'Admin'],
        },
        {
          title: 'Admin Panel',
          icon: '👥',
          screen: 'UserManagement',
          roles: ['Admin'],
        },

        {title: 'Control', icon: '🎛️', screen: 'Control'},
      ].map(({title, icon, screen, roles}) => {
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
            isActive={activeNav === screen}
            darkMode={darkMode}
          />
        );
      })}
    </Animated.View>
  );
};

export default NavPanel;
