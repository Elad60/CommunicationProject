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

const PickRadiosScreen = ({navigation}) => {
  const {user} = useAuth();
  const [allChannels, setAllChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [selected, setSelected] = useState([]);
  const [originalSelection, setOriginalSelection] = useState([]);
  const [search, setSearch] = useState('');

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

  return (
    <AppLayout navigation={navigation} title="Pick Radios">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionCard}>
          <Text style={styles.title}>🎧 Select Your Channels</Text>

          <TextInput
            style={styles.input}
            placeholder="🔍 Search by name / frequency / mode"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />

          {filteredChannels.length === 0 && (
            <Text style={styles.noResults}>No matching channels found.</Text>
          )}

          {filteredChannels.map(c => {
            const isSelected = selected.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => toggleSelect(c.id)}
                style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.channelName}>{c.name}</Text>
                    <Text style={styles.channelFreq}>{c.frequency}</Text>
                    <Text style={styles.channelMode}>Mode: {c.mode}</Text>
                  </View>
                  <Text style={styles.checkIcon}>
                    {isSelected ? '✅' : '＋'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Save Selection</Text>
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
    marginBottom: 15,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  noResults: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  cardSelected: {
    borderColor: '#1DB954',
    backgroundColor: '#2e2e2e',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  channelFreq: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 2,
  },
  channelMode: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 4,
  },
  checkIcon: {
    fontSize: 24,
    color: '#1DB954',
  },
  saveButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PickRadiosScreen;
