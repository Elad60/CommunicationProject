// src/screens/GroupsScreen.js
import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import AppLayout from '../components/AppLayout';

// Sample groups data
const groupsData = [
  {id: 1, name: 'Command Group', members: ['HF 1', 'UHF 1', 'H-VHF 1']},
  {id: 2, name: 'Field Team', members: ['HF 2', 'UHF 2', 'H-VHF 2']},
  {id: 3, name: 'Support Team', members: ['HF 3', 'UHF 3']},
  {id: 4, name: 'Operations', members: ['HF 4', 'UHF 4']},
  {id: 5, name: 'Tactical Group', members: ['HF 5', 'UHF 5']},
];

const GroupsScreen = ({navigation}) => {
  const renderGroupItem = ({item}) => (
    <TouchableOpacity style={styles.groupItem}>
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupMembers}>
        Members: {item.members.join(', ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <AppLayout navigation={navigation} title="Radio Groups">
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Available Groups</Text>
        <FlatList
          data={groupsData}
          renderItem={renderGroupItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#121212',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
    marginLeft: 5,
  },
  list: {
    paddingBottom: 20,
  },
  groupItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  groupMembers: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default GroupsScreen;
