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
import { useSettings } from '../context/SettingsContext';

const MoreRadiosScreen = ({navigation}) => {
  const {user} = useAuth();
  const {darkMode} = useSettings();

  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');  
  const [frequency, setFrequency] = useState('');  
  const [mode, setMode] = useState('');  

  // Load all available channels (admin view)
  const loadChannels = async () => {
    try {
      const data = await radioChannelsApi.getAllChannels();  // Fetching channels
      setChannels(data);  
      setFilteredChannels(data);  
    } catch (err) {
      Alert.alert('Error', 'Failed to load channels');  
    }
  };

  // Create a new radio channel
  const handleAddChannel = async () => {
    // Validation check for input fields
    if (!name || !frequency || !mode) {
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }

    try {
      // Adding the new channel via API
      await radioChannelsApi.addChannel({
        name,
        frequency,
        mode,
        status: 'Active',
        channelState: 'Idle',
      });

      Alert.alert('Success', 'Channel added successfully ✅');  // Success alert
      setName('');  // Resetting inputs
      setFrequency('');
      setMode('');
      loadChannels(); // Refresh list
    } catch (err) {
      console.error('Add channel failed:', err.response?.data || err.message);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to add channel',
      );
    }
  };

  // Delete a channel
  const handleDelete = async id => {
    try {
      await radioChannelsApi.deleteChannel(id);
      loadChannels(); // Refresh list after deletion
    } catch (err) {
      Alert.alert('Error', 'Failed to delete channel');  // Alert in case of failure
    }
  };

  // useEffect hook to load channels when component is mounted
  useEffect(() => {
    loadChannels();
  }, []);

  // Filter channels as user types in search
  useEffect(() => {
    const lowerSearch = search.toLowerCase();  // Converting search term to lowercase
    const filtered = channels.filter(
      c =>
        c.name.toLowerCase().includes(lowerSearch) ||  // Filtering by channel name
        c.frequency.toLowerCase().includes(lowerSearch) ||  // Filtering by frequency
        c.mode.toLowerCase().includes(lowerSearch),  // Filtering by mode
    );
    setFilteredChannels(filtered);  // Updating filtered channels
  }, [search, channels]);

  const styles = getStyles(darkMode);

  return (
    <AppLayout navigation={navigation} title="More Radios">
      <ScrollView contentContainerStyle={styles.container}>

        {/* Channel creation form */}
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

        {/* Search and list of channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.title}>Existing Channels</Text>
          <TextInput
            style={styles.input}
            placeholder="🔍 Search by name / frequency / mode"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />

          {/* If nothing matches search */}
          {filteredChannels.length === 0 && (
            <Text style={styles.noResultsText}>
              No matching channels found.
            </Text>
          )}

          {/* List of channels */}
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

// Function to dynamically generate styles based on dark mode
const getStyles = (darkMode) =>
  StyleSheet.create({
    container: {
      padding: 20,
      alignItems: 'center',
    },
    sectionCard: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
      padding: 15,
      borderRadius: 10,
      marginBottom: 25,
      width: '100%',
      borderWidth: 1,
      borderColor: darkMode ? '#444' : '#ccc',
    },
    title: {
      color: darkMode ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    input: {
      backgroundColor: darkMode ? '#222' : '#fff',
      color: darkMode ? '#fff' : '#000',
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
      width: '100%',
      borderWidth: 1,
      borderColor: darkMode ? '#444' : '#ccc',
    },
    button: {
      backgroundColor: darkMode ? '#0066cc' : '#91aad4',
      padding: 12,
      borderRadius: 5,
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 10,
    },
    buttonText: {
      color: darkMode ? '#fff' : '#000',
      fontWeight: 'bold',
    },
    channelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: darkMode ? '#1e1e1e' : '#e0e0e0',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: darkMode ? '#333' : '#bbb',
    },
    channelName: {
      color: darkMode ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: 'bold',
    },
    channelDetails: {
      color: darkMode ? '#ccc' : '#444',
      fontSize: 13,
    },
    deleteText: {
      color: '#ff4d4d',
      fontSize: 20,
    },
    noResultsText: {
      color: darkMode ? '#888' : '#666',
      fontStyle: 'italic',
      marginTop: 10,
      textAlign: 'center',
    },
  });

export default MoreRadiosScreen;
