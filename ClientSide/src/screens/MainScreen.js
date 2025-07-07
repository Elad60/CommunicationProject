import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  NativeModules,
  Alert,
} from 'react-native';
import RadioChannel from '../components/RadioChannel';
import AppLayout from '../components/AppLayout';
import {useAuth} from '../context/AuthContext';
import {radioChannelsApi} from '../utils/apiService';
import {useSettings} from '../context/SettingsContext';

const {AgoraModule, TestModule} = NativeModules;

const MainScreen = ({navigation}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [radioChannels, setRadioChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleStatus, setModuleStatus] = useState('Not tested yet');

  const {user} = useAuth();
  const {showFrequency, showStatus} = useSettings();

  // Fetch radio channels for the authenticated user
  const fetchRadioChannels = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      const data = await radioChannelsApi.getUserChannels(userId);
      setRadioChannels(data); // Set the fetched radio channels
      setError(null); // Reset error state on successful fetch
    } catch (err) {
      console.error('Error fetching radio channels:', err);
      setError('Failed to load radio channels. Please try again later.'); // Set error message if fetch fails
    } finally {
      setIsLoading(false); // Set loading state to false once fetch is complete
    }
  };

  // Run fetchRadioChannels on component mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchRadioChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle selection of a radio channel
  const handleChannelSelect = id => {
    setSelectedChannel(id); // Set selected channel by id
  };

  // Handle toggle of radio channel state (Idle, ListenOnly, ListenAndTalk)
  const handleToggleChannelState = async channelId => {
    const current = radioChannels.find(c => c.id === channelId);
    const nextState = getNextState(current.channelState); // Get the next state for the channel

    const updatedChannels = radioChannels.map(c =>
      c.id === channelId ? {...c, channelState: nextState} : c,
    );
    setRadioChannels(updatedChannels); // Update the channel state locally

    try {
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');
      await radioChannelsApi.updateChannelState(userId, channelId, nextState); // Update channel state in the backend
    } catch (error) {
      console.error('Error updating channel state:', error); // Handle errors during state update
    }
  };

  // Helper function to get the next state of a channel
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

  // Handle adding a new radio channel
  const handleAddChannel = () => {
    navigation.navigate('PickRadios'); // Navigate to pick radios screen
    console.log('Add channel button pressed');
  };

  // Test function to verify native module is working
  const testAgoraModule = () => {
    // Alert to confirm button press
    Alert.alert('Test Started', '🔍 TESTING NATIVE MODULES...');
    console.log('🔍 testAgoraModule called - starting test');

    let statusText = '';

    try {
      // Check TestModule first
      if (TestModule) {
        Alert.alert(
          'TestModule Status',
          '✅ TestModule is registered correctly!\n🔍 Calling TestModule.TestMethod()...',
        );
        TestModule.TestMethod();
        Alert.alert(
          'TestModule Success',
          '✅ TestModule.TestMethod() called successfully',
        );
        statusText += '✅ TestModule: WORKING\n';
      } else {
        Alert.alert('TestModule Error', '❌ TestModule is null or undefined');
        statusText += '❌ TestModule: NULL\n';
      }

      // Check AgoraModule
      if (!AgoraModule) {
        console.log('❌ AgoraModule is null or undefined');
        Alert.alert(
          'AgoraModule Error',
          '❌ AgoraModule is null or undefined - module not registered properly',
        );
        statusText += '❌ AgoraModule: NULL\n';
        setModuleStatus(statusText);
        return;
      }

      console.log('✅ AgoraModule found, calling InitializeAgoraEngine');
      Alert.alert(
        'AgoraModule Status',
        '✅ AgoraModule found!\n🔍 Calling AgoraModule.InitializeAgoraEngine()...',
      );
      statusText += '✅ AgoraModule: WORKING\n';

      // Test with the real App ID - now using proper C++ SDK
      console.log('🔧 About to call InitializeAgoraEngine with App ID');
      alert('DEBUG: About to call InitializeAgoraEngine');
      AgoraModule.InitializeAgoraEngine('06b3fb2ecc694ca38c7b2e44c52e2d57');
      alert('DEBUG: InitializeAgoraEngine called - check C:\\temp\\agora_debug.log');
      console.log('✅ InitializeAgoraEngine called successfully');
      Alert.alert(
        'AgoraModule Success',
        '✅ AgoraModule.InitializeAgoraEngine() called successfully',
      );
      statusText += '✅ Initialize: SUCCESS\n';

      // Test JoinChannel method
      Alert.alert('Channel Test', '🔍 Testing AgoraModule.JoinChannel()...');
      AgoraModule.JoinChannel('test-voice-channel');
      Alert.alert(
        'Channel Success',
        '✅ AgoraModule.JoinChannel() called successfully',
      );
      statusText += '✅ JoinChannel: SUCCESS\n';

      // Test LeaveChannel method (NEW)
      Alert.alert('Leave Test', '🔍 Testing AgoraModule.LeaveChannel()...');
      AgoraModule.LeaveChannel();
      Alert.alert(
        'Leave Success',
        '✅ AgoraModule.LeaveChannel() called successfully',
      );
      statusText += '✅ LeaveChannel: SUCCESS\n';

      // Test ReleaseEngine method (NEW)
      Alert.alert('Release Test', '🔍 Testing AgoraModule.ReleaseEngine()...');
      AgoraModule.ReleaseEngine();
      Alert.alert(
        'Release Success',
        '✅ AgoraModule.ReleaseEngine() called successfully',
      );
      statusText += '✅ ReleaseEngine: SUCCESS';

      Alert.alert(
        'Test Complete',
        '✅ VOICE COMMUNICATION CYCLE TESTED\n\n' + statusText,
      );

      setModuleStatus(statusText);
    } catch (error) {
      Alert.alert(
        'Test Error',
        `❌ Error testing Native Modules:\n${error.message}`,
      );
      statusText += `❌ ERROR: ${error.message}`;
      setModuleStatus(statusText);
    }
  };

  // Individual test functions for detailed debugging
  const testJoinChannel = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Join Test', '🔍 Testing JoinChannel only...');
      AgoraModule.JoinChannel('test-voice-channel');
      Alert.alert('Success', '✅ JoinChannel called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ JoinChannel failed: ${error.message}`);
    }
  };

  const testLeaveChannel = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Leave Test', '🔍 Testing LeaveChannel only...');
      AgoraModule.LeaveChannel();
      Alert.alert('Success', '✅ LeaveChannel called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ LeaveChannel failed: ${error.message}`);
    }
  };

  const testReleaseEngine = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Release Test', '🔍 Testing ReleaseEngine only...');
      AgoraModule.ReleaseEngine();
      Alert.alert('Success', '✅ ReleaseEngine called successfully');
    } catch (error) {
      Alert.alert('Error', `❌ ReleaseEngine failed: ${error.message}`);
    }
  };

  // Check function loading status
  const checkFunctionStatus = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }

      // Use callback pattern for React Native method
      AgoraModule.GetFunctionLoadingStatus(status => {
        Alert.alert('Function Loading Status', status);
      });
    } catch (error) {
      Alert.alert('Error', `❌ Failed to get status: ${error.message}`);
    }
  };

  // Echo test functions
  const startEchoTest = () => {
    try {
      console.log('🎤 startEchoTest called');
      if (!AgoraModule) {
        console.log('❌ AgoraModule not available in startEchoTest');
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      console.log('🔧 About to call StartEchoTest');
      Alert.alert(
        'Echo Test',
        '🎤 Starting echo test...\n\nSpeak into your microphone - you should hear your voice after 3 seconds!',
      );
      AgoraModule.StartEchoTest();
      console.log('✅ StartEchoTest called successfully');
    } catch (error) {
      console.log('❌ StartEchoTest error:', error.message);
      Alert.alert('Error', `❌ StartEchoTest failed: ${error.message}`);
    }
  };

  const stopEchoTest = () => {
    try {
      if (!AgoraModule) {
        Alert.alert('Error', '❌ AgoraModule not available');
        return;
      }
      Alert.alert('Echo Test', '🛑 Stopping echo test...');
      AgoraModule.StopEchoTest();
    } catch (error) {
      Alert.alert('Error', `❌ StopEchoTest failed: ${error.message}`);
    }
  };

  // Show loading indicator while data is being fetched
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

  // Show error message and retry button if fetching channels fails
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

  // Render the main content when data is successfully fetched
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
                  numberOfChannels={radioChannels.length}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddChannel}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testAgoraModule}>
          <Text style={styles.testButtonText}>Test Agora</Text>
        </TouchableOpacity>

        {/* Individual test buttons for detailed testing */}
        <TouchableOpacity style={styles.joinButton} onPress={testJoinChannel}>
          <Text style={styles.testButtonText}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveButton} onPress={testLeaveChannel}>
          <Text style={styles.testButtonText}>Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.releaseButton}
          onPress={testReleaseEngine}>
          <Text style={styles.testButtonText}>Release</Text>
        </TouchableOpacity>

        {/* Function Status Check Button */}
        <TouchableOpacity
          style={styles.statusCheckButton}
          onPress={checkFunctionStatus}>
          <Text style={styles.testButtonText}>Status</Text>
        </TouchableOpacity>

        {/* Echo Test Buttons */}
        <TouchableOpacity
          style={styles.startEchoButton}
          onPress={startEchoTest}>
          <Text style={styles.testButtonText}>Start Echo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopEchoButton} onPress={stopEchoTest}>
          <Text style={styles.testButtonText}>Stop Echo</Text>
        </TouchableOpacity>

        {/* Module Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Module Status:</Text>
          <Text style={styles.statusText}>{moduleStatus}</Text>
        </View>
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
    justifyContent: 'center',
    paddingVertical: 10,
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
  testButton: {
    position: 'absolute',
    left: 20,
    bottom: 30,
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testText: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 100,
    color: '#333',
  },
  statusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  joinButton: {
    position: 'absolute',
    left: 20,
    bottom: 90,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  leaveButton: {
    position: 'absolute',
    left: 90,
    bottom: 90,
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  releaseButton: {
    position: 'absolute',
    left: 160,
    bottom: 90,
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  statusCheckButton: {
    position: 'absolute',
    left: 220,
    bottom: 90,
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 60,
  },
  startEchoButton: {
    position: 'absolute',
    left: 20,
    bottom: 150,
    backgroundColor: '#9C27B0',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
  stopEchoButton: {
    position: 'absolute',
    left: 110,
    bottom: 150,
    backgroundColor: '#E91E63',
    padding: 8,
    borderRadius: 5,
    elevation: 5,
    minWidth: 80,
  },
});

export default MainScreen;
