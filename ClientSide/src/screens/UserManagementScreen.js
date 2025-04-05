import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {
  getAllUsers,
  blockUser,
  updateUserRole,
  deleteUser,
} from '../utils/adminApi';

const UserManagementScreen = ({navigation}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBlock = async user => {
    await blockUser(user.id, !user.isBlocked);
    loadUsers();
  };

  const handleToggleRole = async user => {
    const newRole = user.role === 'Operator' ? 'Technician' : 'Operator';
    await updateUserRole(user.id, newRole);
    loadUsers();
  };

  const handleDelete = async user => {
    await deleteUser(user.id);
    loadUsers();
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
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleToggleRole(item)}>
          <Text style={styles.buttonText}>Toggle Role</Text>
        </TouchableOpacity>
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
      {loading ? (
        <ActivityIndicator size="large" color="#00f" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#1e1e1e',
    margin: 10,
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
  },
  deleteButton: {
    backgroundColor: '#cc0000',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
  },
});

export default UserManagementScreen;
