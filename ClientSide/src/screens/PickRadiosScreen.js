import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
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
  const [selected, setSelected] = useState([]);
  const [originalSelection, setOriginalSelection] = useState([]); // ✅

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const [all, userSelected] = await Promise.all([
          radioChannelsApi.getAllChannels(),
          radioChannelsApi.getUserChannels(user.id),
        ]);

        setAllChannels(all);
        const userSelectedIds = userSelected.map(c => c.id);
        setSelected(userSelectedIds);
        setOriginalSelection(userSelectedIds); // ✅ Save initial state
      } catch (err) {
        Alert.alert('Error', 'Failed to load channels');
      }
    };

    loadChannels();
  }, [user.id]);

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
        {allChannels.map(c => {
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
                <Text style={styles.checkIcon}>{isSelected ? '✅' : '＋'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Save Selection</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
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
