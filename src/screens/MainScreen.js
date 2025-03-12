import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import NavButton from '../components/NavButton';
import ControlButton from '../components/ControlButton';
import {useAuth} from '../context/AuthContext';

// Sample radio channel data
const radioChannelsData = [
  {id: 1, name: 'HF 1', frequency: '12.564 MHz', isActive: true, mode: 'rx_tx'},
  {
    id: 2,
    name: 'UHF 1',
    frequency: '425.100 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 3,
    name: 'UHF 6',
    frequency: '492.700 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {id: 4, name: 'HF 2', frequency: '3.140 MHz', isActive: true, mode: 'rx_tx'},
  {
    id: 5,
    name: 'UHF 2',
    frequency: '508.200 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 6,
    name: 'L-VHF 1',
    frequency: '67.375 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 7,
    name: 'HF 3',
    frequency: '7.250 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 8,
    name: 'UHF 3',
    frequency: '412.300 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 9,
    name: 'L-VHF 2',
    frequency: '53.125 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 10,
    name: 'HF 4',
    frequency: '11.897 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 11,
    name: 'UHF 4',
    frequency: '487.800 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 12,
    name: 'H-VHF 1',
    frequency: '161.200 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 13,
    name: 'HF 5',
    frequency: '15.735 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 14,
    name: 'UHF 5',
    frequency: '456.200 MHz',
    isActive: true,
    mode: 'rx_tx',
  },
  {
    id: 15,
    name: 'H-VHF 2',
    frequency: '148.700 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {
    id: 16,
    name: 'HF 6',
    frequency: '8.992 MHz',
    isActive: true,
    mode: 'rx_only',
  },
  {id: 17, name: 'Radio 17', frequency: '', isActive: false, mode: 'rx_tx'},
  {id: 18, name: 'Radio 18', frequency: '', isActive: false, mode: 'rx_tx'},
];

const MainScreen = ({navigation, onLogout}) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [activeNav, setActiveNav] = useState('radios');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const {user} = useAuth();

  // Handle navigation between screens
  const handleNavigation = screen => {
    switch (screen) {
      case 'radios':
        // Already on radios screen
        setActiveNav('radios');
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

  // Handle channel selection
  const handleChannelSelect = id => {
    setSelectedChannel(id);
    // Optionally navigate to channel details
    // navigation.navigate('ChannelDetails', { channelId: id });
  };

  return (
    <View style={styles.container}>
      {/* Top header section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Commander</Text>
        {user && (
          <Text style={styles.userInfo}>Logged in as: {user.username}</Text>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main grid for radio channels */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {radioChannelsData.map(channel => (
            <TouchableOpacity
              key={channel.id}
              onPress={() => handleChannelSelect(channel.id)}>
              <RadioChannel
                name={channel.name}
                frequency={channel.frequency}
                isActive={channel.isActive}
                mode={channel.mode}
                isSelected={selectedChannel === channel.id}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Right navigation panel */}
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

      {/* Bottom control panel */}
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
            if (selectedChannel) {
              // Handle channel volume
              alert(
                `Adjusting volume for ${
                  radioChannelsData.find(c => c.id === selectedChannel)?.name
                }`,
              );
            } else {
              alert('Please select a channel first');
            }
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
  scrollView: {
    flex: 1,
    marginRight: 100, // Space for nav panel
    marginBottom: 60, // Add space for bottom panel
    //marginLeft: 100,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    justifyContent: 'flex-start',
  },
  navPanel: {
    width: 100,
    position: 'absolute',
    right: 0,
    top: 50,
    bottom: 60, // Stop before the bottom panel
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlPanel: {
    height: 60,
    width: '100%', // Full width
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default MainScreen;
