import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {radioChannelsApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';
import {useVoice} from '../context/VoiceContext';

const PickRadiosScreen = ({navigation}) => {
  const {user} = useAuth(); // Fetch user info from authentication context
  const [allChannels, setAllChannels] = useState([]); // State for all radio channels
  const [filteredChannels, setFilteredChannels] = useState([]); // State for filtered radio channels based on search
  const [selected, setSelected] = useState([]); // State for selected radio channels
  const [originalSelection, setOriginalSelection] = useState([]); // State for original selected channels to compare changes
  const [search, setSearch] = useState(''); // State for search input
  const [hasChanges, setHasChanges] = useState(false); // State to track if user made changes
  const {darkMode, showFrequency, showStatus} = useSettings(); // Fetch dark mode and settings for frequency/status display
  const {activeVoiceChannel, leaveVoiceChannel} = useVoice();
  const [discardHovering, setDiscardHovering] = useState(false);
  const [saveHovering, setSaveHovering] = useState(false);

  useEffect(() => {
    // Function to load all radio channels and user's selected channels
    const loadChannels = async () => {
      try {
        const [all, userSelected] = await Promise.all([
          radioChannelsApi.getAllChannels(), // Fetch all channels
          radioChannelsApi.getUserChannels(user.id), // Fetch channels user has selected
        ]);

        setAllChannels(all); // Set all channels to state
        setFilteredChannels(all); // Set filtered channels initially to all channels
        const userSelectedIds = userSelected.map(c => c.id); // Extract selected channel IDs from response
        setSelected(userSelectedIds); // Set the selected channels
        setOriginalSelection(userSelectedIds); // Set the original selection to compare later
      } catch (err) {
        Alert.alert('Error', 'Failed to load channels'); // Error handling
      }
    };

    loadChannels();
  }, [user.id]); // Only reload channels when the user ID changes

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

  // Track changes in selection
  useEffect(() => {
    const hasSelectionChanges =
      selected.length !== originalSelection.length ||
      selected.some(id => !originalSelection.includes(id)) ||
      originalSelection.some(id => !selected.includes(id));

    setHasChanges(hasSelectionChanges);
  }, [selected, originalSelection]);

  const toggleSelect = channelId => {
    // Toggle channel selection
    setSelected(
      prev =>
        prev.includes(channelId)
          ? prev.filter(id => id !== channelId) // Remove from selection if already selected
          : [...prev, channelId], // Add to selection if not selected
    );
  };

  const handleSave = async () => {
    // Save the updated selected channels to the user's list
    try {
      const toAdd = selected.filter(id => !originalSelection.includes(id)); // Channels to add
      const toRemove = originalSelection.filter(id => !selected.includes(id)); // Channels to remove

      for (let id of toAdd) {
        await radioChannelsApi.addUserChannel(user.id, id); // Add each new channel
      }

      for (let id of toRemove) {
        // If the channel being removed is currently active, disconnect voice first
        if (activeVoiceChannel === id) {
          await leaveVoiceChannel();
        }
        await radioChannelsApi.removeUserChannel(user.id, id); // Remove each unselected channel
      }

      setOriginalSelection(selected); // Update original selection
      setHasChanges(false); // Reset changes flag
      Alert.alert('Success', 'Channels saved to your list'); // Success alert
      navigation.goBack(); // Go back to the previous screen
    } catch (err) {
      Alert.alert('Error', 'Failed to save channels'); // Error handling
    }
  };

  const handleDiscard = () => {
    // Discard changes and revert to original selection
    setSelected(originalSelection);
    setHasChanges(false);
  };

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
    headerContainer: {
      backgroundColor: darkMode ? '#1c1c1e' : '#fff',
      borderBottomColor: darkMode ? '#444' : '#e0e0e0',
    },
    headerContent: {
      backgroundColor: darkMode ? '#1c1c1e' : '#fff',
    },
    headerTitle: {
      color: darkMode ? '#fff' : '#000',
    },
    actionButton: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
      borderColor: darkMode ? '#444' : '#ddd',
    },
    actionButtonText: {
      color: darkMode ? '#fff' : '#000',
    },
    saveActionButton: {
      backgroundColor: '#1DB954',
    },
    saveActionButtonText: {
      color: '#fff',
    },
    discardActionButton: {
      backgroundColor: darkMode ? '#444' : '#f0f0f0',
    },
    discardActionButtonText: {
      color: darkMode ? '#ff6b6b' : '#ff4757',
    },
  });

  return (
    <AppLayout navigation={navigation} title="Pick Rooms">
      {/* Action Header - Only show when there are changes */}
      {hasChanges && (
        <View style={[styles.actionHeader, dynamicStyles.headerContainer]}>
          <View
            style={[styles.actionHeaderContent, dynamicStyles.headerContent]}>
            <Text style={[styles.actionHeaderTitle, dynamicStyles.headerTitle]}>
              🎯 Room Selection
            </Text>
            <View style={styles.actionButtons}>
              <Pressable
                onPress={handleDiscard}
                onHoverIn={() => setDiscardHovering(true)}
                onHoverOut={() => setDiscardHovering(false)}
                style={[
                  styles.logoutLikeButton,
                  {
                    backgroundColor: discardHovering
                      ? darkMode
                        ? '#3a3a3a'
                        : '#e9ecef'
                      : darkMode
                      ? '#2a2a2a'
                      : '#f8f9fa',
                    borderColor: discardHovering
                      ? darkMode
                        ? '#555555'
                        : '#adb5bd'
                      : darkMode
                      ? '#404040'
                      : '#dee2e6',
                    marginRight: 8,
                  },
                ]}>
                <View style={styles.logoutLikeContent}>
                  <Image
                    source={require('../../assets/logos/crossed-HF.png')}
                    style={[
                      styles.logoutLikeImage,
                      {
                        tintColor: discardHovering
                          ? darkMode
                            ? '#c82333'
                            : '#c82333'
                          : darkMode
                          ? '#dc3545'
                          : '#dc3545',
                      },
                    ]}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.logoutLikeText,
                      {
                        color: discardHovering
                          ? darkMode
                            ? '#fff'
                            : '#212529'
                          : darkMode
                          ? '#e9ecef'
                          : '#495057',
                      },
                    ]}>
                    Discard
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={handleSave}
                onHoverIn={() => setSaveHovering(true)}
                onHoverOut={() => setSaveHovering(false)}
                style={[
                  styles.logoutLikeButton,
                  {
                    backgroundColor: saveHovering
                      ? darkMode
                        ? '#3a3a3a'
                        : '#e9ecef'
                      : darkMode
                      ? '#2a2a2a'
                      : '#f8f9fa',
                    borderColor: saveHovering
                      ? darkMode
                        ? '#555555'
                        : '#adb5bd'
                      : darkMode
                      ? '#404040'
                      : '#dee2e6',
                  },
                ]}>
                <View style={styles.logoutLikeContent}>
                  <Image
                    source={require('../../assets/logos/radio.png')}
                    style={[
                      styles.logoutLikeImage,
                      {
                        tintColor: saveHovering
                          ? darkMode
                            ? '#388e3c'
                            : '#388e3c'
                          : darkMode
                          ? '#1DB954'
                          : '#21bf73',
                      },
                    ]}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.logoutLikeText,
                      {
                        color: saveHovering
                          ? darkMode
                            ? '#fff'
                            : '#212529'
                          : darkMode
                          ? '#e9ecef'
                          : '#495057',
                      },
                    ]}>
                    Save Changes
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.container, dynamicStyles.container]}>
        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.title, dynamicStyles.title]}>
            🎧 Select Your Rooms
          </Text>

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="🔍 Search by name / mode"
            placeholderTextColor={darkMode ? '#aaa' : '#888'}
            value={search}
            onChangeText={setSearch} // Update search state on input change
          />

          {filteredChannels.length === 0 && (
            <Text style={[styles.noResults, dynamicStyles.noResults]}>
              No matching rooms found.
            </Text>
          )}

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
                    {/* Frequency removed */}
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
  actionHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutLikeButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    minWidth: 110,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutLikeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLikeImage: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  logoutLikeText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default PickRadiosScreen;
