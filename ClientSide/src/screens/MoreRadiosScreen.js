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
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [mode, setMode] = useState('');

  const loadChannels = async () => {
    try {
      const data = await radioChannelsApi.getAllChannels();
      setChannels(data);
      setFilteredChannels(data);
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
    loadChannels();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = channels.filter(
      c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.frequency.toLowerCase().includes(lowerSearch) ||
        c.mode.toLowerCase().includes(lowerSearch),
    );
    setFilteredChannels(filtered);
  }, [search, channels]);

  return (
    <AppLayout navigation={navigation} title="More Radios">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Add Channel Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.title}>Add New Channel</Text>
          <TextInput
            style={styles.input}
            placeholder="🔤 Channel Name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="📶 Frequency"
            placeholderTextColor="#aaa"
            value={frequency}
            onChangeText={setFrequency}
          />
          <TextInput
            style={styles.input}
            placeholder="🛠️ Mode"
            placeholderTextColor="#aaa"
            value={mode}
            onChangeText={setMode}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddChannel}>
            <Text style={styles.buttonText}>Create Channel</Text>
          </TouchableOpacity>
        </View>

        {/* Search + List Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.title}>Existing Channels</Text>
          <TextInput
            style={styles.input}
            placeholder="🔍 Search by name / frequency / mode"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />

          {filteredChannels.length === 0 && (
            <Text style={styles.noResultsText}>
              No matching channels found.
            </Text>
          )}

          {filteredChannels.map(c => (
            <View key={c.id} style={styles.channelRow}>
              <View>
                <Text style={styles.channelName}>{c.name}</Text>
                <Text style={styles.channelDetails}>
                  {c.frequency} • {c.mode}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(c.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  channelName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelDetails: {
    color: '#ccc',
    fontSize: 13,
  },
  deleteText: {
    color: '#ff4d4d',
    fontSize: 20,
  },
  noResultsText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default MoreRadiosScreen;
