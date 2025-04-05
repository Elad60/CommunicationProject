import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';
import {radioChannelsApi} from '../utils/apiService';

const MainScreen = ({navigation}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {user} = useAuth(); // ✅ Access the current logged-in user

  const fetchRadioChannels = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      const data = await radioChannelsApi.getAllChannels(userId);
      setRadioChannels(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching radio channels:', err);
      setError('Failed to load radio channels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.id) {
      fetchRadioChannels();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle channel selection
  const handleChannelSelect = id => {
    setSelectedChannel(id);
    // Optionally navigate to channel details
    // navigation.navigate('ChannelDetails', { channelId: id });
  };
  const handleToggleChannelState = async channelId => {
    const current = radioChannels.find(c => c.id === channelId);
    const nextState = getNextState(current.channelState);

    const updatedChannels = radioChannels.map(c =>
      c.id === channelId ? {...c, channelState: nextState} : c,
    );
    setRadioChannels(updatedChannels);

    try {
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');
      await radioChannelsApi.updateChannelState(userId, channelId, nextState);
    } catch (error) {
      console.error('Error updating channel state:', error);
    }
  };

  const getNextState = state => {
    switch (state) {
      case 'Idle':
        return 'ListenOnly';
      case 'ListenOnly':
        return 'ListenAndTalk';
      case 'ListenAndTalk':
        return 'Idle';
      default:
        return 'Idle';
    }
  };

  // Render loading indicator
  if (loading) {
    return (
      <AppLayout navigation={navigation} title={user?.role}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      </AppLayout>
    );
  }

  // Render error message
  if (error) {
    return (
      <AppLayout navigation={navigation} title={user?.role}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRadioChannels()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation} title={user?.role}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {radioChannels.map(channel => (
            <TouchableOpacity
              key={channel.id}
              onPress={() => {
                handleChannelSelect(channel.id);
                handleToggleChannelState(channel.id);
              }}>
              <RadioChannel
                name={channel.name}
                frequency={channel.frequency}
                isActive={channel.status === 'Active'}
                mode={channel.mode}
                isSelected={selectedChannel === channel.id}
                channelState={channel.channelState}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default MainScreen;
