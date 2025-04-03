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
import radioChannelsApi from '../utils/apiService';


const MainScreen = ({navigation}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {getAuthToken} = useAuth(); // Assuming your AuthContext provides this

const fetchRadioChannels = async () => {
  try {
    setLoading(true);

    // Use the Axios API call
    const data = await radioChannelsApi.getAllChannels();

    // Update state with fetched data
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
    fetchRadioChannels();
  }, []); // Empty dependency array means this effect runs once when component mounts

  // Handle channel selection
  const handleChannelSelect = id => {
    setSelectedChannel(id);
    // Optionally navigate to channel details
    // navigation.navigate('ChannelDetails', { channelId: id });
  };

  // Render loading indicator
  if (loading) {
    return (
      <AppLayout navigation={navigation} title="Commander">
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
      <AppLayout navigation={navigation} title="Commander">
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
    <AppLayout navigation={navigation} title="Commander">
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainGrid}>
          {radioChannels.map(channel => (
            <TouchableOpacity
              key={channel.id}
              onPress={() => handleChannelSelect(channel.id)}>
              <RadioChannel
                name={channel.name}
                frequency={channel.frequency}
                isActive={channel.isActive}
                mode={channel.mode}
                isSelected={selectedChannel === channel.id}
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
