import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {radioChannelsApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';

const PickRadiosScreen = ({navigation}) => {
  const {user} = useAuth(); // Fetch user info from authentication context
  const [allChannels, setAllChannels] = useState([]); // State for all radio channels
  const [filteredChannels, setFilteredChannels] = useState([]); // State for filtered radio channels based on search
  const [selected, setSelected] = useState([]); // State for selected radio channels
  const [originalSelection, setOriginalSelection] = useState([]); // State for original selected channels to compare changes
  const [search, setSearch] = useState(''); // State for search input
  const {darkMode, showFrequency, showStatus} = useSettings(); // Fetch dark mode and settings for frequency/status display

  // Load all channels and the user's selected channels on mount
  useEffect(() => {
    // Function to load all radio channels and user's selected channels
    const loadChannels = async () => {
      try {
        const [all, userSelected] = await Promise.all([
          radioChannelsApi.getAllChannels(), // Fetch all channels
          radioChannelsApi.getUserChannels(user.id), // Fetch channels user has selected
        ]);

        setAllChannels(all);
        setFilteredChannels(all);

        // Save selected channel IDs to compare later for changes
        const userSelectedIds = userSelected.map(c => c.id);
        setSelected(userSelectedIds);
        setOriginalSelection(userSelectedIds);
      } catch (err) {
        Alert.alert('Error', 'Failed to load channels'); // Error handling
      }
    };

    loadChannels();
  }, [user.id]); // Only reload channels when the user ID changes

  // Filter channels when search input changes
  useEffect(() => {
    // Filter channels based on search input
    const lowerSearch = search.toLowerCase();
    const filtered = allChannels.filter(
      c =>
        c.name.toLowerCase().includes(lowerSearch) || // Match name
        c.frequency.toLowerCase().includes(lowerSearch) || // Match frequency
        c.mode.toLowerCase().includes(lowerSearch), // Match mode
    );
    setFilteredChannels(filtered); // Set the filtered channels to state
  }, [search, allChannels]); // Re-filter channels when search term or allChannels changes

  // Toggle channel selection on press
  const toggleSelect = channelId => {
    // Toggle channel selection
    setSelected(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId) // Remove from selection if already selected
        : [...prev, channelId], // Add to selection if not selected
    );
  };

  // Save updated selection to backend
  const handleSave = async () => {
    // Save the updated selected channels to the user's list
    try {
      const toAdd = selected.filter(id => !originalSelection.includes(id)); // Channels to add
      const toRemove = originalSelection.filter(id => !selected.includes(id)); // Channels to remove

      for (let id of toAdd) {
        await radioChannelsApi.addUserChannel(user.id, id); // Add each new channel
      }

      for (let id of toRemove) {
        await radioChannelsApi.removeUserChannel(user.id, id); // Remove each unselected channel
      }

      Alert.alert('Success', 'Channels saved to your list'); // Success alert
      navigation.goBack(); // Go back to the previous screen
    } catch (err) {
      Alert.alert('Error', 'Failed to save channels'); // Error handling
    }
  };

  // Dynamic styles based on darkMode
  const dynamicStyles = StyleSheet.create({
    // Dynamic styling based on dark mode
    sectionCard: {
      backgroundColor: darkMode ? '#2a2a2a' : '#fff',
      borderColor: darkMode ? '#444' : '#ccc',
    },
    title: {
      color: darkMode ? '#fff' : '#000',
    },
    input: {
      backgroundColor: darkMode ? '#222' : '#f0f0f0',
      color: darkMode ? '#fff' : '#000',
      borderColor: darkMode ? '#444' : '#ccc',
    },
    noResults: {
      color: darkMode ? '#888' : '#666',
    },
    card: {
      backgroundColor: darkMode ? '#1c1c1e' : '#f9f9f9',
      borderColor: darkMode ? '#444' : '#ccc',
    },
    cardSelected: {
      backgroundColor: darkMode ? '#2e2e2e' : '#d0f0e0',
      borderColor: '#1DB954', // Highlight color for selected channels
    },
    channelName: {
      color: darkMode ? '#fff' : '#000',
    },
    channelFreq: {
      color: darkMode ? '#aaa' : '#555',
    },
    channelMode: {
      color: darkMode ? '#ccc' : '#777',
    },
    channelStatus: {
      color: darkMode ? '#bbb' : '#333',
    },
    checkIcon: {
      color: darkMode ? '#1DB954' : '#007a3d', // Checkmark color for selected channels
    },
    saveButton: {
      backgroundColor: darkMode ? '#1DB954' : '#21bf73', // Save button color
    },
    saveButtonText: {
      color: darkMode ? '#fff' : '#000',
    },
  });

  return (
    <AppLayout navigation={navigation} title="Pick Radios">
      <ScrollView
        contentContainerStyle={[styles.container, dynamicStyles.container]}>
        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.title, dynamicStyles.title]}>
            🎧 Select Your Channels
          </Text>

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="🔍 Search by name / frequency / mode"
            placeholderTextColor={darkMode ? '#aaa' : '#888'}
            value={search}
            onChangeText={setSearch} // Update search state on input change
          />

          {/* No matching channels */}
          {filteredChannels.length === 0 && (
            <Text style={[styles.noResults, dynamicStyles.noResults]}>
              No matching channels found.
            </Text>
          )}

          {/* List of all available channels */}
          {filteredChannels.map(c => {
            const isSelected = selected.includes(c.id); // Check if channel is selected
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => toggleSelect(c.id)} // Toggle selection on press
                style={[
                  styles.card,
                  dynamicStyles.card,
                  isSelected && styles.cardSelected, // Highlight selected card
                  isSelected && dynamicStyles.cardSelected,
                ]}>
                <View style={styles.cardContent}>
                  <View>
                    <Text
                      style={[styles.channelName, dynamicStyles.channelName]}>
                      {c.name}
                    </Text>
                    {showFrequency && (
                      <Text
                        style={[styles.channelFreq, dynamicStyles.channelFreq]}>
                        {c.frequency}
                      </Text>
                    )}
                    <Text
                      style={[styles.channelMode, dynamicStyles.channelMode]}>
                      Mode: {c.mode}
                    </Text>
                    {showStatus && c.status && (
                      <Text
                        style={[
                          styles.channelStatus,
                          dynamicStyles.channelStatus,
                        ]}>
                        Status: {c.status}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.checkIcon, dynamicStyles.checkIcon]}>
                    {isSelected ? '✅' : '＋'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.saveButton, dynamicStyles.saveButton]}
            onPress={handleSave}> // Save button to submit selection
            <Text style={[styles.saveButtonText, dynamicStyles.saveButtonText]}>
              💾 Save Selection
            </Text>
          </TouchableOpacity>
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
  },
  noResults: {
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardSelected: {
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 18,
    fontWeight: '600',
  },
  channelFreq: {
    fontSize: 14,
    marginTop: 2,
  },
  channelMode: {
    fontSize: 13,
    marginTop: 4,
  },
  channelStatus: {
    fontSize: 13,
    marginTop: 4,
  },
  checkIcon: {
    fontSize: 24,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PickRadiosScreen;