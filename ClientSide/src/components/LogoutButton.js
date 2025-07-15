import React, {useState} from 'react';
import {Text, StyleSheet, Pressable, View, Image} from 'react-native';

// Professional LogoutButton with clean corporate design
const LogoutButton = ({onLogout, darkMode = false}) => {
  const [hovering, setHovering] = useState(false);

  // Professional color scheme
  const colors = {
    background: darkMode ? '#2a2a2a' : '#f8f9fa',
    backgroundHover: darkMode ? '#3a3a3a' : '#e9ecef',
    border: darkMode ? '#404040' : '#dee2e6',
    borderHover: darkMode ? '#555555' : '#adb5bd',
    text: darkMode ? '#e9ecef' : '#495057',
    textHover: darkMode ? '#ffffff' : '#212529',
    icon: darkMode ? '#dc3545' : '#dc3545',
    iconHover: darkMode ? '#c82333' : '#c82333',
  };

  return (
    <Pressable
      onPress={onLogout}
      onHoverIn={() => setHovering(true)}
      onHoverOut={() => setHovering(false)}
      style={[
        styles.container,
        {
          backgroundColor: hovering
            ? colors.backgroundHover
            : colors.background,
          borderColor: hovering ? colors.borderHover : colors.border,
        },
      ]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logos/logout.png')}
          style={[
            styles.logoImage,
            {
              tintColor: hovering ? colors.iconHover : colors.icon,
            },
          ]}
          resizeMode="contain"
        />

        <Text
          style={[
            styles.text,
            {
              color: hovering ? colors.textHover : colors.text,
            },
          ]}>
          Sign out
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    minWidth: 90,
    // Subtle shadow for depth
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default LogoutButton;
