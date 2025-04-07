import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import {radioChannelsApi} from '../utils/apiService';

const MoreRadiosScreen = ({navigation}) => {
  const {user} = useAuth();
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [mode, setMode] = useState('');

  const loadChannels = async () => {
    try {
      const data = await radioChannelsApi.getAllChannels();
      setChannels(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load channels');
    }
  };

  const handleAddChannel = async () => {
    if (!name || !frequency || !mode) {
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }

    try {
      await radioChannelsApi.addChannel({
        name,
        frequency,
        mode,
        status: 'Active',
        channelState: 'Idle',
      });

      Alert.alert('Success', 'Channel added successfully ✅');
      setName('');
      setFrequency('');
      setMode('');
      loadChannels();
    } catch (err) {
      console.error('Add channel failed:', err.response?.data || err.message);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to add channel',
      );
    }
  };

  const handleDelete = async id => {
    try {
      await radioChannelsApi.deleteChannel(id);
      loadChannels();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete channel');
    }
  };

  useEffect(() => {
    if (user?.role === 'Technician' || user?.role === 'Admin') {
      loadChannels();
    } else {
      Alert.alert('Access Denied', 'You are not allowed here.');
      navigation.goBack();
    }
  }, [navigation, user?.role]);

  return (
    <AppLayout navigation={navigation} title="More Radios">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add New Channel</Text>
        <TextInput
          style={styles.input}
          placeholder="Channel Name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Frequency"
          placeholderTextColor="#aaa"
          value={frequency}
          onChangeText={setFrequency}
        />
        <TextInput
          style={styles.input}
          placeholder="Mode"
          placeholderTextColor="#aaa"
          value={mode}
          onChangeText={setMode}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddChannel}>
          <Text style={styles.buttonText}>Create Channel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Existing Channels</Text>
        {channels.map(c => (
          <View key={c.id} style={styles.channelRow}>
            <Text style={styles.channelText}>
              {c.name} ({c.frequency}) - {c.mode}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(c.id)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'flex-start',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    width: '85%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    width: '85%',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  channelText: {
    color: '#fff',
    fontSize: 14,
  },
  deleteText: {
    color: '#ff4d4d',
    fontSize: 18,
  },
});

export default MoreRadiosScreen;
