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
  const {darkMode} = useSettings(); // Access dark mode setting
  const [users, setUsers] = useState([]); // State for all users
  const [filteredUsers, setFilteredUsers] = useState([]); // State for filtered users
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering users
  const [loading, setLoading] = useState(true); // Loading state for fetching data
  const {user: currentUser} = useAuth(); // Access current authenticated user

  // Function to load all users from the API
  const loadUsers = async () => {
    try {
      setLoading(true); // Set loading to true before fetching data
      const data = await adminApi.getAllUsers();
      const filtered = data.filter(u => u.id !== currentUser?.id); // Exclude current user
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (err) {
      console.error('Error loading users:', err);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false); // Set loading to false after fetching is done
    }
  };

  useEffect(() => {
    loadUsers(); // Load users on component mount
  }, []);

  // Filter users based on search query
  useEffect(() => {
    const lower = searchQuery.toLowerCase(); // Convert query to lowercase for case-insensitive search
    const filtered = users.filter(
      u =>
        u.username.toLowerCase().includes(lower) || 
        u.email.toLowerCase().includes(lower),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Handle toggling block status for a user
  const handleToggleBlock = async user => {
    try {
      await adminApi.blockUser(user.id, !user.isBlocked);
      loadUsers(); // Reload users after toggling block status
    } catch (err) {
      Alert.alert('Error', 'Failed to update block status.');
    }
  };

  // Handle toggling role for a user
  const handleToggleRole = async user => {
    const newRole =
      user.role === 'Operator'
        ? 'Technician'
        : user.role === 'Technician'
        ? 'Operator'
        : 'Technician'; // Toggle between roles
    try {
      await adminApi.updateUserRole(user.id, newRole);
      loadUsers(); // Reload users after role update
    } catch (err) {
      Alert.alert('Error', 'Failed to update user role.');
    }
  };

  // Handle deleting a user
  const handleDelete = async user => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.username}?`,
      [
        {text: 'Cancel', style: 'cancel'}, // Cancel action
        {
          text: 'Delete',
          style: 'destructive', // Destructive style for delete
          onPress: async () => {
            try {
              await adminApi.deleteUser(user.id);
              loadUsers(); // Reload users after deletion
            } catch (err) {
              Alert.alert('Error', 'Failed to delete user.');
            }
          },
        },
      ],
    );
  };

  const styles = getStyles(darkMode); // Get styles based on dark mode

  return (
    <AppLayout navigation={navigation} title="User Management">
      <View style={{flex: 1}}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or email"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery} // Update search query on text input change
        />

        {loading ? (
          <ActivityIndicator size="large" color="#00f" /> // Show loading indicator while fetching data
        ) : (
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {/* Column Headers for user table */}
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

            {/* Map over filtered users and display them */}
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
            {filteredUsers.length === 0 && (
              <Text style={styles.noUsersText}>No users found.</Text> // Display message if no users match the search
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
      color: darkMode ? '#aaa' : '#000',
    },
  });

export default UserManagementScreen;
