/* eslint-disable react-hooks/exhaustive-deps */
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
import UserRow from '../components/UserRow';
import AppLayout from '../components/AppLayout';
import {adminApi} from '../utils/apiService';
import {useAuth} from '../context/AuthContext';
import {useSettings} from '../context/SettingsContext';

const UserManagementScreen = ({navigation}) => {
  const {darkMode} = useSettings();
  const [users, setUsers] = useState([]); // All users (excluding self)
  const [filteredUsers, setFilteredUsers] = useState([]); // Search-filtered list
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const {user: currentUser} = useAuth();

  // Fetch all users from the server (excluding the current admin)
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
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
    loadUsers(); // Initial load on mount
  }, []);

  // Filter users based on search query (username or email)
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = users.filter(
      u =>
        u.username.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Toggle block/unblock user
  const handleToggleBlock = async user => {
    try {
      await adminApi.blockUser(user.id, !user.isBlocked);
      loadUsers(); // Refresh list
    } catch (err) {
      Alert.alert('Error', 'Failed to update block status.');
    }
  };

  // Toggle user role between Operator and Technician
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

  // Delete user with confirmation prompt
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

  const styles = getStyles(darkMode); // Apply styling based on theme

  return (
    <AppLayout navigation={navigation} title="User Management">
      <View style={{flex: 1}}>
        {/* Search bar */}
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
            {/* Column Headers */}
            <View style={styles.columnHeaders}>
              <Text style={[styles.headerText, {flex: 2}]}>Name</Text>
              <View style={[styles.middleHeader, {flex: 2}]}>
                <Text style={styles.headerText}>Role</Text>
                <Text style={styles.headerText}>Joined</Text>
                <Text style={styles.headerText}>Status</Text>
              </View>
              <Text style={[styles.headerText, {flex: 3, textAlign: 'right'}]}>
                Actions
              </Text>
            </View>

            {/* List of users */}
            {filteredUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                darkMode={darkMode}
                onBlockToggle={handleToggleBlock}
                onRoleToggle={handleToggleRole}
                onDelete={handleDelete}
              />
            ))}

            {/* No users found message */}
            {filteredUsers.length === 0 && (
              <Text style={styles.noUsersText}>No users found.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </AppLayout>
  );
};


const getStyles = darkMode =>
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
    noUsersText: {
      textAlign: 'center',
      color: '#ccc',
      marginTop: 30,
    },
    columnHeaders: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingBottom: 10,
      marginTop: 10,
    },
    middleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 6,
    },
    headerText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: darkMode ? '#aaa' : '#000', // <- changed to black for light mode
    },
  });

export default UserManagementScreen;
