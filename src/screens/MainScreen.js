import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';

const radioChannelsData = [
  { id: 1, name: 'HF 1', frequency: '12.564 MHz', isActive: true, mode: 'rx_tx' },
  { id: 2, name: 'UHF 1', frequency: '425.100 MHz', isActive: true, mode: 'rx_tx' },
  { id: 3, name: 'UHF 6', frequency: '492.700 MHz', isActive: true, mode: 'rx_only' },
  { id: 4, name: 'HF 2', frequency: '3.140 MHz', isActive: true, mode: 'rx_tx' },
  { id: 5, name: 'UHF 2', frequency: '508.200 MHz', isActive: true, mode: 'rx_tx' },
  { id: 6, name: 'L-VHF 1', frequency: '67.375 MHz', isActive: true, mode: 'rx_only' },
  { id: 7, name: 'HF 3', frequency: '7.250 MHz', isActive: true, mode: 'rx_only' },
  { id: 8, name: 'UHF 3', frequency: '412.300 MHz', isActive: true, mode: 'rx_only' },
  { id: 9, name: 'L-VHF 2', frequency: '53.125 MHz', isActive: true, mode: 'rx_only' },
  { id: 10, name: 'HF 4', frequency: '11.897 MHz', isActive: true, mode: 'rx_tx' },
  { id: 11, name: 'UHF 4', frequency: '487.800 MHz', isActive: true, mode: 'rx_only' },
  { id: 12, name: 'H-VHF 1', frequency: '161.200 MHz', isActive: true, mode: 'rx_tx' },
  { id: 13, name: 'HF 5', frequency: '15.735 MHz', isActive: true, mode: 'rx_tx' },
  { id: 14, name: 'UHF 5', frequency: '456.200 MHz', isActive: true, mode: 'rx_tx' },
  { id: 15, name: 'H-VHF 2', frequency: '148.700 MHz', isActive: true, mode: 'rx_only' },
  { id: 16, name: 'HF 6', frequency: '8.992 MHz', isActive: true, mode: 'rx_only' },
  { id: 17, name: 'Radio 17', frequency: '', isActive: false, mode: 'rx_tx' },
  { id: 18, name: 'Radio 18', frequency: '', isActive: false, mode: 'rx_tx' },
];

const MainScreen = ({navigation}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Handle channel selection
  const handleChannelSelect = id => {
    setSelectedChannel(id);
    // Optionally navigate to channel details
    // navigation.navigate('ChannelDetails', { channelId: id });
  };

  return (
    <AppLayout navigation={navigation} title="Commander">
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
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    justifyContent: 'flex-start',
  },
});

export default MainScreen;
