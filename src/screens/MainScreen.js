import React, { useState } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import ControlButton from '../components/ControlButton';
import { useAuth } from '../context/AuthContext';
import DraggableNavPanel from '../components/DraggableNavPanel'; 

const radioChannelsData = [
  {id: 1, name: 'HF 1', frequency: '12.564 MHz', isActive: true, mode: 'rx_tx'},
  {id: 2, name: 'UHF 1', frequency: '425.100 MHz', isActive: true, mode: 'rx_tx'},
  {id: 3, name: 'UHF 6', frequency: '492.700 MHz', isActive: true, mode: 'rx_only'},
  {id: 4, name: 'HF 2', frequency: '3.140 MHz', isActive: true, mode: 'rx_tx'},
  {id: 5, name: 'UHF 2', frequency: '508.200 MHz', isActive: true, mode: 'rx_tx'},
  {id: 6, name: 'L-VHF 1', frequency: '67.375 MHz', isActive: true, mode: 'rx_only'},
  {id: 7, name: 'HF 3', frequency: '7.250 MHz', isActive: true, mode: 'rx_only'},
  {id: 8, name: 'UHF 3', frequency: '412.300 MHz', isActive: true, mode: 'rx_only'},
  {id: 9, name: 'L-VHF 2', frequency: '53.125 MHz', isActive: true, mode: 'rx_only'},
  {id: 10, name: 'HF 4', frequency: '11.897 MHz', isActive: true, mode: 'rx_tx'},
  {id: 11, name: 'UHF 4', frequency: '487.800 MHz', isActive: true, mode: 'rx_only'},
  {id: 12, name: 'H-VHF 1', frequency: '161.200 MHz', isActive: true, mode: 'rx_tx'},
  {id: 13, name: 'HF 5', frequency: '15.735 MHz', isActive: true, mode: 'rx_tx'},
  {id: 14, name: 'UHF 5', frequency: '456.200 MHz', isActive: true, mode: 'rx_tx'},
  {id: 15, name: 'H-VHF 2', frequency: '148.700 MHz', isActive: true, mode: 'rx_only'},
  {id: 16, name: 'HF 6', frequency: '8.992 MHz', isActive: true, mode: 'rx_only'},
  {id: 17, name: 'Radio 17', frequency: '', isActive: false, mode: 'rx_tx'},
  {id: 18, name: 'Radio 18', frequency: '', isActive: false, mode: 'rx_tx'},
];


const MainScreen = ({ navigation, onLogout }) => {
  const [speakerVolume, setSpeakerVolume] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [activeNav, setActiveNav] = useState('radios');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const { user } = useAuth();

  const handleNavigation = screen => {
    setActiveNav(screen);
    navigation.navigate(screen);
  };

  const handleChannelSelect = id => {
    setSelectedChannel(id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Commander</Text>
        {user && <Text style={styles.userInfo}>Logged in as: {user.username}</Text>}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main grid for radio channels */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {radioChannelsData.map(channel => (
            <TouchableOpacity key={channel.id} onPress={() => handleChannelSelect(channel.id)}>
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

      {/* Draggable Navigation Panel */}
      <DraggableNavPanel activeNav={activeNav} handleNavigation={handleNavigation} navigation={navigation} />


      {/* Bottom control panel */}
      <View style={styles.controlPanel}>
        <ControlButton
          title="Speaker"
          icon="🔊"
          value={speakerVolume}
          onPress={() => setSpeakerVolume((speakerVolume + 10) % 110)}
        />
        <ControlButton
          title="Ch Vol"
          icon="🎚️"
          onPress={() =>
            selectedChannel
              ? alert(`Adjusting volume for ${radioChannelsData.find(c => c.id === selectedChannel)?.name}`)
              : alert('Please select a channel first')
          }
        />
        <ControlButton
          title="Bright"
          icon="☀️"
          value={brightness}
          onPress={() => setBrightness((brightness + 20) % 120)}
        />
        <ControlButton title="Mute All" icon="🔇" onPress={() => setSpeakerVolume(0)} />
        <ControlButton title="Settings" icon="⚙️" onPress={() => navigation.navigate('Settings')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userInfo: { color: '#aaa', fontSize: 14 },
  logoutButton: { backgroundColor: '#5A5A5A', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  logoutText: { color: '#fff', fontSize: 12 },
  scrollView: { flex: 1, marginBottom: 60 },
  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 5, justifyContent: 'flex-start' },
  controlPanel: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default MainScreen;
