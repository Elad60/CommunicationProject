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
import {useSettings} from '../context/SettingsContext';
import {useTutorial} from '../context/TutorialContext';
import TutorialTooltip from '../components/TutorialTooltip';
import AsyncStorage from '@react-native-async-storage/async-storage';
const MainScreen = ({navigation}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const {user} = useAuth();
  const {showFrequency, showStatus} = useSettings();
  const {
    hasSeenTutorial,
    markTutorialSeen,
    loading: tutorialLoading,
  } = useTutorial();

  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    '📡 This is your radio grid. Tap a channel to change its state.',
    '➕ Press this + button to add new radios to your grid.',
    '🧭 Use the side and bottom panels to navigate or control.',
  ];

  const fetchRadioChannels = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      const data = await radioChannelsApi.getUserChannels(userId);
      setRadioChannels(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching radio channels:', err);
      setError('Failed to load radio channels. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    AsyncStorage.removeItem('hasSeenTutorial');
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRadioChannels();
    }
  }, [user]);

  const handleChannelSelect = id => {
    setSelectedChannel(id);
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

  const handleAddChannel = () => {
    navigation.navigate('PickRadios');
    console.log('Add channel button pressed');
  };

  if (isLoading) {
    return (
      <AppLayout navigation={navigation} title={user?.role}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      </AppLayout>
    );
  }

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
      <View style={styles.container}>
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
                  showFrequency={showFrequency}
                  showStatus={showStatus}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddChannel}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {/* 🔥 Tooltip Tutorial Overlay */}
        {!tutorialLoading &&
          !hasSeenTutorial &&
          tutorialStep < tutorialSteps.length && (
            <TutorialTooltip
              text={tutorialSteps[tutorialStep]}
              step={tutorialStep + 1}
              totalSteps={tutorialSteps.length}
              onNext={() => {
                if (tutorialStep + 1 === tutorialSteps.length) {
                  markTutorialSeen();
                } else {
                  setTutorialStep(prev => prev + 1);
                }
              }}
            />
          )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#1DB954',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default MainScreen;
