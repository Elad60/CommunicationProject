import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import NavButton from '../components/NavButton';
import ControlButton from '../components/ControlButton';
import {TouchableOpacity} from 'react-native';

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


const MainScreen = () => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [activeNav, setActiveNav] = useState('radios');
  const [selectedChannel, setSelectedChannel] = useState(null);

  return (
    <View style={styles.container}>
      {/* Top header section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Commander</Text>
      </View>

      {/* Main grid for radio channels */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {radioChannelsData.map(channel => (
            <RadioChannel
              key={channel.id}
              name={channel.name}
              frequency={channel.frequency}
              isActive={channel.isActive}
              mode={channel.mode}
            />
          ))}
        </View>
      </ScrollView>

      {/* Right navigation panel */}
      <View style={styles.navPanel}>
        <NavButton
          title="Groups"
          icon="👥"
          isActive={activeNav === 'groups'}
          onPress={() => setActiveNav('groups')}
        />
        <NavButton
          title="Intercoms"
          icon="🔊"
          isActive={activeNav === 'intercoms'}
          onPress={() => setActiveNav('intercoms')}
        />
        <NavButton
          title="PAS"
          icon="📢"
          isActive={activeNav === 'pas'}
          onPress={() => setActiveNav('pas')}
        />
        <NavButton
          title="Radios"
          icon="📻"
          isActive={activeNav === 'more_radios'}
          onPress={() => setActiveNav('more_radios')}
        />
        <NavButton
          title="Relay"
          icon="🔄"
          isActive={activeNav === 'relay'}
          onPress={() => setActiveNav('relay')}
        />
        <NavButton
          title="Control"
          icon="🎛️"
          isActive={activeNav === 'control'}
          onPress={() => setActiveNav('control')}
        />
      </View>

      {/* Bottom control panel */}
      <View style={styles.controlPanel}>
        <ControlButton
          title="Speaker"
          icon="🔊"
          value={speakerVolume}
          onPress={() => {}} // Add volume control logic
        />
        <ControlButton
          title="Ch Vol"
          icon="🎚️"
          onPress={() => {}} // Add channel volume control logic
        />
        <ControlButton
          title="Bright"
          icon="☀️"
          value={brightness}
          onPress={() => {}} // Add brightness control logic
        />
        <ControlButton
          title="Mute All"
          icon="🔇"
          onPress={() => {}} // Add mute logic
        />
        <ControlButton
          title="Settings"
          icon="⚙️"
          onPress={() => {}} // Add settings navigation logic
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    marginRight: 100, // Space for nav panel
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
    bottom: 60,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlPanel: {
    height: 60,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default MainScreen;
