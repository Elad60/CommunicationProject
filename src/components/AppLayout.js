// src/components/AppLayout.js
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import NavButton from './NavButton';
import ControlButton from './ControlButton';
import {useAuth} from '../context/AuthContext';

const AppLayout = ({
  children,
  navigation,
  title,
  showControls = true,
  showNavPanel = true,
}) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [activeNav, setActiveNav] = useState('radios');
  const {user, logout} = useAuth();

  // Handle navigation between screens
  const handleNavigation = screen => {
    switch (screen) {
      case 'radios':
        setActiveNav('radios');
        navigation.navigate('Main');
        break;
      case 'groups':
        setActiveNav('groups');
        navigation.navigate('Groups');
        break;
      case 'intercoms':
        setActiveNav('intercoms');
        navigation.navigate('Intercoms');
        break;
      case 'pas':
        setActiveNav('pas');
        navigation.navigate('Pas');
        break;
      case 'more_radios':
        setActiveNav('more_radios');
        navigation.navigate('ChannelConfig');
        break;
      case 'relay':
        setActiveNav('relay');
        navigation.navigate('Relay');
        break;
      case 'control':
        setActiveNav('control');
        navigation.navigate('Control');
        break;
      default:
        setActiveNav('radios');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top header section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{title || 'Communication System'}</Text>
        {user && (
          <Text style={styles.userInfo}>Logged in as: {user.username}</Text>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main content area with space for nav panel */}
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.mainContent,
            showNavPanel
              ? styles.mainContentWithNav
              : styles.mainContentFullWidth,
          ]}>
          {children}
        </View>

        {/* Right navigation panel */}
        {showNavPanel && (
          <View style={styles.navPanel}>
            <NavButton
              title="Radios"
              icon="📻"
              isActive={activeNav === 'radios'}
              onPress={() => handleNavigation('radios')}
            />
            <NavButton
              title="Groups"
              icon="👥"
              isActive={activeNav === 'groups'}
              onPress={() => handleNavigation('groups')}
            />
            <NavButton
              title="Intercoms"
              icon="🔊"
              isActive={activeNav === 'intercoms'}
              onPress={() => handleNavigation('intercoms')}
            />
            <NavButton
              title="PAS"
              icon="📢"
              isActive={activeNav === 'pas'}
              onPress={() => handleNavigation('pas')}
            />
            <NavButton
              title="More Radios"
              icon="📻"
              isActive={activeNav === 'more_radios'}
              onPress={() => handleNavigation('more_radios')}
            />
            <NavButton
              title="Relay"
              icon="🔄"
              isActive={activeNav === 'relay'}
              onPress={() => handleNavigation('relay')}
            />
            <NavButton
              title="Control"
              icon="🎛️"
              isActive={activeNav === 'control'}
              onPress={() => handleNavigation('control')}
            />
          </View>
        )}
      </View>

      {/* Bottom control panel */}
      {showControls && (
        <View style={styles.controlPanel}>
          <ControlButton
            title="Speaker"
            icon="🔊"
            value={speakerVolume}
            onPress={() => {
              // Volume control logic
              const newVolume = (speakerVolume + 10) % 110;
              setSpeakerVolume(newVolume);
            }}
          />
          <ControlButton
            title="Ch Vol"
            icon="🎚️"
            onPress={() => {
              // Channel volume control logic
              alert('Channel volume control');
            }}
          />
          <ControlButton
            title="Bright"
            icon="☀️"
            value={brightness}
            onPress={() => {
              // Brightness control logic
              const newBrightness = (brightness + 20) % 120;
              setBrightness(newBrightness);
            }}
          />
          <ControlButton
            title="Mute All"
            icon="🔇"
            onPress={() => {
              // Mute logic
              setSpeakerVolume(0);
            }}
          />
          <ControlButton
            title="Settings"
            icon="⚙️"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
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
    height: 50,
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
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  mainContentWithNav: {
    marginRight: 100, // Space for nav panel
    marginBottom: 60, // Space for bottom panel
  },
  mainContentFullWidth: {
    marginBottom: 60, // Space for bottom panel only
  },
  navPanel: {
    width: 100,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 60, // Stop before the bottom panel
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  controlPanel: {
    height: 60,
    width: '92.5%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
});

export default AppLayout;
