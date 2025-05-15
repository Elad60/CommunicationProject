import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const UserRow = ({user, darkMode, onBlockToggle, onRoleToggle, onDelete}) => {
  const styles = getStyles(darkMode);

  return (
    <View style={styles.row}>
      {/* Left: Basic user info */}
      <View style={styles.leftSection}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Middle: Role, creation date, block status */}
      <View style={styles.middleSection}>
        <Text style={[styles.badge, styles.roleBadge]}>{user.role}</Text>
        <Text style={styles.infoText}>
          {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        <Text
          style={[
            styles.badge,
            user.isBlocked ? styles.blockedBadge : styles.activeBadge,
          ]}>
          {user.isBlocked ? 'Blocked' : 'Active'}
        </Text>
      </View>

      {/* Right: Action buttons */}
      <View style={styles.rightSection}>
        {/* Show role toggle only for non-admins */}
        {user.role !== 'Admin' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onRoleToggle(user)}
            style={styles.neuButton}>
            <Text style={styles.neuButtonText}>
              Make {user.role === 'Operator' ? 'Technician' : 'Operator'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onBlockToggle(user)}
          style={styles.neuButton}>
          <Text style={styles.neuButtonText}>
            {user.isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onDelete(user)}
          style={[styles.neuButton, {backgroundColor: '#ff6666'}]}>
          <Text style={[styles.neuButtonText, {color: '#fff'}]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles are theme-aware (light/dark)
const getStyles = darkMode =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      backgroundColor: darkMode ? '#1f1f1f' : '#fff',
      borderBottomWidth: 1,
      borderColor: darkMode ? '#333' : '#ddd',
      padding: 15,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flex: 2,
    },
    middleSection: {
      flex: 2,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    rightSection: {
      flex: 3,
      alignItems: 'flex-end',
      gap: 6, // spacing between buttons
    },
    username: {
      fontSize: 16,
      color: darkMode ? '#fff' : '#000',
      fontWeight: 'bold',
    },
    email: {
      fontSize: 12,
      color: darkMode ? '#aaa' : '#555',
    },
    infoText: {
      fontSize: 12,
      color: darkMode ? '#aaa' : '#000',
    },
    badge: {
      fontSize: 12,
      color: darkMode ? '#fff' : '#000',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      overflow: 'hidden',
    },
    roleBadge: {
      backgroundColor: darkMode ? '#444' : '#e0e0e0',
    },
    blockedBadge: {
      backgroundColor: '#d63031',
    },
    activeBadge: {
      backgroundColor: darkMode ? '#555' : '#cfcfcf',
    },
    neuButton: {
      backgroundColor: darkMode ? '#2e2e2e' : '#e6e6e6',
      borderRadius: 30,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: darkMode ? '#444' : '#d3d3d3',
      shadowColor: darkMode ? '#000' : '#999',
      shadowOffset: {width: 2, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    neuButtonText: {
      color: darkMode ? '#ddd' : '#4d4d4d',
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default UserRow;
