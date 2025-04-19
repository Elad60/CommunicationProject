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
  const {user} = useAuth();
  const [allChannels, setAllChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [selected, setSelected] = useState([]);
  const [originalSelection, setOriginalSelection] = useState([]);
  const [search, setSearch] = useState('');
  const {darkMode, showFrequency, showStatus} = useSettings();

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const [all, userSelected] = await Promise.all([
          radioChannelsApi.getAllChannels(),
          radioChannelsApi.getUserChannels(user.id),
        ]);

        setAllChannels(all);
        setFilteredChannels(all);
        const userSelectedIds = userSelected.map(c => c.id);
        setSelected(userSelectedIds);
        setOriginalSelection(userSelectedIds);
      } catch (err) {
        Alert.alert('Error', 'Failed to load channels');
      }
    };

    loadChannels();
  }, [user.id]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = allChannels.filter(
      c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.frequency.toLowerCase().includes(lowerSearch) ||
        c.mode.toLowerCase().includes(lowerSearch),
    );
    setFilteredChannels(filtered);
  }, [search, allChannels]);

  const toggleSelect = channelId => {
    setSelected(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId],
    );
  };

  const handleSave = async () => {
    try {
      const toAdd = selected.filter(id => !originalSelection.includes(id));
      const toRemove = originalSelection.filter(id => !selected.includes(id));

      for (let id of toAdd) {
        await radioChannelsApi.addUserChannel(user.id, id);
      }

      for (let id of toRemove) {
        await radioChannelsApi.removeUserChannel(user.id, id);
      }

      Alert.alert('Success', 'Channels saved to your list');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save channels');
    }
  };

  const dynamicStyles = StyleSheet.create({
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
      borderColor: '#1DB954',
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
      color: darkMode ? '#1DB954' : '#007a3d',
    },
    saveButton: {
      backgroundColor: darkMode ? '#1DB954' : '#21bf73',
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
            onChangeText={setSearch}
          />

          {filteredChannels.length === 0 && (
            <Text style={[styles.noResults, dynamicStyles.noResults]}>
              No matching channels found.
            </Text>
          )}

          {filteredChannels.map(c => {
            const isSelected = selected.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => toggleSelect(c.id)}
                style={[
                  styles.card,
                  dynamicStyles.card,
                  isSelected && styles.cardSelected,
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
            onPress={handleSave}>
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
