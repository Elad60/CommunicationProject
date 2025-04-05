import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {adminApi} from '../utils/apiService';

const UserManagementScreen = ({navigation}) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
      setUsers(data);
      setFilteredUsers(data); // Initialize filtered users
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

  const renderItem = ({item}) => (
    <View style={styles.userCard}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.details}>Email: {item.email}</Text>
      <Text style={styles.details}>Role: {item.role}</Text>
      <Text style={styles.details}>
        Blocked: {item.isBlocked ? 'Yes' : 'No'}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleToggleBlock(item)}>
          <Text style={styles.buttonText}>
            {item.isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
        {item.role !== 'Admin' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleToggleRole(item)}>
            <Text style={styles.buttonText}>
              Make {item.role === 'Operator' ? 'Technician' : 'Operator'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AppLayout navigation={navigation} title="User Management">
      <View style={styles.container}>
        <TextInput
          placeholder="Search by username or email..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#00f" />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{paddingBottom: 20}}
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  userCard: {
    backgroundColor: '#1e1e1e',
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  details: {
    fontSize: 14,
    color: '#ccc',
    marginVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#cc0000',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default UserManagementScreen;
