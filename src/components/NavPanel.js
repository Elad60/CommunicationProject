import React, { useState, useRef} from 'react';
import { Animated, PanResponder, Dimensions} from 'react-native';
import NavButton from './NavButton';
import { useSettings } from '../context/SettingsContext';

const { width,height } = Dimensions.get('window');
const NAV_PANEL_WIDTH = width * 0.08;
const NAV_PANEL_HEIGHT = height * 0.95;

const NavPanel = ({ activeNav, handleNavigation}) => {
  const { toolBarAdjustment } = useSettings();
  const position = useRef(new Animated.Value(width - NAV_PANEL_WIDTH)).current;
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0); 

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => toolBarAdjustment,
      onMoveShouldSetPanResponder: () => toolBarAdjustment,   
      onPanResponderGrant: (_, gestureState) => {
        setDragging(true);
        setStartX(gestureState.moveX); 
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.moveX - NAV_PANEL_WIDTH / 2;
        newX = Math.max(0, Math.min(newX, width - NAV_PANEL_WIDTH));
        position.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        setDragging(false);

        const movementThreshold = 10; 
        const movedDistance = Math.abs(gestureState.moveX - startX); 

        if (movedDistance < movementThreshold) {
          return;
        }

        const middleScreen = width / 2;
        const finalX = gestureState.moveX < middleScreen ? 0 : width - NAV_PANEL_WIDTH;

        Animated.spring(position, {
          toValue: finalX,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        height:NAV_PANEL_HEIGHT,
        width: NAV_PANEL_WIDTH,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'space-around',
        transform: [{ translateX: position }],
        opacity: dragging ? 0.8 : 1,
      }}
      {...panResponder.panHandlers}
    >
      {[
        { title: 'Radios', icon: '📻', screen: 'Main' },
        { title: 'Groups', icon: '👥', screen: 'Groups' },
        { title: 'Intercoms', icon: '🔊', screen: 'Intercoms' },
        { title: 'PAS', icon: '📢', screen: 'Pas' },
        { title: 'More Radios', icon: '📻', screen: 'ChannelConfig' },
        { title: 'Relay', icon: '🔄', screen: 'Relay' },
        { title: 'Control', icon: '🎛️', screen: 'Control' },
      ].map(({ title, icon, screen }) => (
        <NavButton
          key={screen}
          title={title}
          icon={icon}
          isActive={activeNav === screen}
          onPress={() => handleNavigation(screen)}
          //onPress={toolBarAdjustment ? null : () => handleNavigation(screen)} 
        />

      ))}
    </Animated.View>
  );
};

export default NavPanel;
