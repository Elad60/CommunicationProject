import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import StyledButton from '../components/StyledButton';
import {useAuth} from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import {radioChannelsApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';

const MoreRadiosScreen = ({navigation}) => {
  const {user} = useAuth(); // Fetching user data from AuthContext
  const {darkMode} = useSettings(); // Fetching dark mode setting from SettingsContext
  const [channels, setChannels] = useState([]); // State to hold all channels
  const [filteredChannels, setFilteredChannels] = useState([]); // State to hold filtered channels based on search
  const [search, setSearch] = useState(''); // Search term for filtering channels

  const [name, setName] = useState(''); // State to hold new channel name input
  const [mode, setMode] = useState('Public'); // 'Public' or 'Private'
  const [pinCode, setPinCode] = useState(''); // For Private rooms

  // Function to load all channels from the API
  const loadChannels = async () => {
    try {
      const data = await radioChannelsApi.getAllChannels(); // Fetching channels
      setChannels(data); // Storing channels in state
      setFilteredChannels(data); // Also setting filtered channels to all channels initially
    } catch (err) {
      Alert.alert('Error', 'Failed to load channels'); // Alert in case of failure
    }
  };

  // Function to handle adding a new channel
  const handleAddChannel = async () => {
    // Validation check for input fields
    if (!name || (mode === 'Private' && pinCode.length !== 4)) {
      Alert.alert(
        'Missing Fields',
        mode === 'Private'
          ? 'All fields are required and PIN must be 4 digits.'
          : 'All fields are required.',
      );
      return;
    }

    try {
      // Adding the new room via API
      await radioChannelsApi.addChannel({
        name,
        frequency: '', // Always send frequency, even if empty
        mode,
        pinCode: mode === 'Private' ? pinCode : undefined,
        status: 'Active',
        channelState: 'Idle',
      });

      Alert.alert('Success', 'Room added successfully ✅'); // Success alert
      setName(''); // Resetting inputs
      setPinCode('');
      setMode('Public');
      loadChannels(); // Reload channels after adding
    } catch (err) {
      console.error('Add room failed:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add room');
    }
  };

  // Function to handle deleting a channel
  const handleDelete = async id => {
    if (user.role !== 'Admin') {
      Alert.alert('Unauthorized', 'Only admins can delete channels.');
      return;
    }
    try {
      await radioChannelsApi.deleteChannel(id); // Deleting the channel
      loadChannels(); // Reload channels after deletion
    } catch (err) {
      Alert.alert('Error', 'Failed to delete channel'); // Alert in case of failure
    }
  };

  // useEffect hook to load channels when component is mounted
  useEffect(() => {
    loadChannels();
  }, []);

  // useEffect hook to filter channels whenever search term or channels change
  useEffect(() => {
    const lowerSearch = search.toLowerCase(); // Converting search term to lowercase
    const filtered = channels.filter(
      c =>
        c.name.toLowerCase().includes(lowerSearch) || // Filtering by channel name
        c.frequency.toLowerCase().includes(lowerSearch) || // Filtering by frequency
        c.mode.toLowerCase().includes(lowerSearch), // Filtering by mode
    );
    setFilteredChannels(filtered); // Updating filtered channels
  }, [search, channels]);

  // Getting styles based on dark mode
  const styles = getStyles(darkMode);

  return (
    <AppLayout navigation={navigation} title="More Rooms">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Add Room Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.title}>Add New Room</Text>
          <TextInput
            style={styles.input}
            placeholder="🔤 Room Name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}>
            <Text style={{marginRight: 10, color: darkMode ? '#fff' : '#000'}}>
              Public
            </Text>
            <Switch
              value={mode === 'Private'}
              onValueChange={val => setMode(val ? 'Private' : 'Public')}
              thumbColor={mode === 'Private' ? '#607D8B' : '#4CAF50'}
              trackColor={{false: '#bdbdbd', true: '#90caf9'}}
            />
            <Text style={{marginLeft: 10, color: darkMode ? '#fff' : '#000'}}>
              Private
            </Text>
          </View>
          {mode === 'Private' && (
            <TextInput
              style={styles.input}
              placeholder="🔒 4-digit PIN"
              placeholderTextColor="#aaa"
              value={pinCode}
              onChangeText={text => {
                // Only allow numbers and max 4 digits
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setPinCode(cleaned);
              }}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          )}
          <StyledButton
            onPress={handleAddChannel}
            darkMode={darkMode}
            style={{marginTop: 5, marginBottom: 10, minWidth: 120}}>
            Create Room
          </StyledButton>
        </View>

        {/* Search + List Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.title}>Existing Rooms</Text>
          <TextInput
            style={styles.input}
            placeholder="🔍 Search by name / mode"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />

          {filteredChannels.length === 0 && (
            <Text style={styles.noResultsText}>No matching rooms found.</Text>
          )}

          {filteredChannels.map(c => (
            <View key={c.id} style={styles.channelRow}>
              <View>
                <Text style={styles.channelName}>{c.name}</Text>
                <Text style={styles.channelDetails}>{c.mode}</Text>
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
const getStyles = darkMode =>
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
