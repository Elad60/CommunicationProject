import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {adminApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const UserManagementScreen = ({navigation}) => {
  const {darkMode} = useSettings();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const {user: currentUser} = useAuth();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();

      // Exclude the logged-in user
      const filtered = data.filter(u => u.id !== currentUser?.id);

      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (err) {
      console.error('Error loading users:', err);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = users.filter(
      u =>
        u.username.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleToggleBlock = async user => {
    try {
      await adminApi.blockUser(user.id, !user.isBlocked);
      loadUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update block status.');
    }
  };

  const handleToggleRole = async user => {
    const newRole =
      user.role === 'Operator'
        ? 'Technician'
        : user.role === 'Technician'
        ? 'Operator'
        : 'Technician';
    try {
      await adminApi.updateUserRole(user.id, newRole);
      loadUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update user role.');
    }
  };

  const handleDelete = async user => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.username}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteUser(user.id);
              loadUsers();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete user.');
            }
          },
        },
      ],
    );
  };
  const styles = getStyles(darkMode);

  return (
    <AppLayout navigation={navigation} title="User Management">
      <View style={{flex: 1}}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or email"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#00f" />
        ) : (
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {filteredUsers.map(user => (
              <View key={user.id} style={styles.userCard}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.details}>Email: {user.email}</Text>
                <Text style={styles.details}>Role: {user.role}</Text>
                <Text style={styles.details}>
                  Blocked: {user.isBlocked ? 'Yes' : 'No'}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleToggleBlock(user)}>
                    <Text style={styles.buttonText}>
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                  </TouchableOpacity>
                  {user.role !== 'Admin' && (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => handleToggleRole(user)}>
                      <Text style={styles.buttonText}>
                        Make{' '}
                        {user.role === 'Operator' ? 'Technician' : 'Operator'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(user)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {filteredUsers.length === 0 && (
              <Text style={{textAlign: 'center', color: '#ccc', marginTop: 30}}>
                No users found.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </AppLayout>
  );
};

const getStyles = (darkMode) =>
  StyleSheet.create({
    searchInput: {
      backgroundColor: darkMode ? '#2a2a2a' : '#fff',
      color: darkMode ? '#fff' : '#000',
      padding: 10,
      margin: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: darkMode ? '#555' : '#ccc',
    },
    userCard: {
      backgroundColor: darkMode ? '#1e1e1e' : '#f0f0f0',
      marginHorizontal: 10,
      marginVertical: 5,
      padding: 15,
      borderRadius: 10,
      borderColor: darkMode ? '#444' : '#ddd',
      borderWidth: 1,
    },
    username: {
      fontSize: 18,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#000',
    },
    details: {
      fontSize: 14,
      color: darkMode ? '#ccc' : '#555',
      marginVertical: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: 10,
      justifyContent: 'space-between',
    },
    button: {
      backgroundColor: darkMode ? '#0066cc' : '#91aad4',
      padding: 8,
      borderRadius: 5,
      flex: 1,
      marginRight: 5,
    },
    deleteButton: {
      backgroundColor: darkMode ?'#cc0000' : '#ff6666',
      padding: 8,
      borderRadius: 5,
      flex: 1,
      marginLeft: 5,
    },
    buttonText: {
      color: darkMode ? '#fff' : '#000',
      fontSize: 13,
      textAlign: 'center',
    },
  });

export default UserManagementScreen;
