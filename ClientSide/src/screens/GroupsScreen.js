import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import { useSettings } from '../context/SettingsContext'; 

const groupsData = [
  { id: 1, name: 'Command Group', members: ['HF 1', 'UHF 1', 'H-VHF 1'] },
  { id: 2, name: 'Field Team', members: ['HF 2', 'UHF 2', 'H-VHF 2'] },
  { id: 3, name: 'Support Team', members: ['HF 3', 'UHF 3'] },
  { id: 4, name: 'Operations', members: ['HF 4', 'UHF 4'] },
  { id: 5, name: 'Tactical Group', members: ['HF 5', 'UHF 5'] },
];

const GroupsScreen = ({ navigation }) => {
  const { darkMode } = useSettings(); 

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        {
          backgroundColor: darkMode ? '#1E1E1E' : '#f2f2f2',
          borderLeftColor: '#0066cc',
        },
      ]}
    >
      <Text style={[styles.groupName, { color: darkMode ? '#fff' : '#000' }]}>
        {item.name}
      </Text>
      <Text style={[styles.groupMembers, { color: darkMode ? '#aaa' : '#333' }]}>
        Members: {item.members.join(', ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <AppLayout navigation={navigation} title="Radio Groups">
      <View
        style={[
          styles.container,
          { backgroundColor: darkMode ? '#121212' : '#fff' },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: darkMode ? '#fff' : '#000' },
          ]}
        >
          Available Groups
        </Text>
        <FlatList
          data={groupsData}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id.toString()}
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 5,
  },
  list: {
    paddingBottom: 20,
  },
  groupItem: {
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    borderLeftWidth: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupMembers: {
    fontSize: 14,
  },
});

export default GroupsScreen;
