import React, {useRef, useState} from 'react';
import {Animated, Text, StyleSheet, View, Pressable, Image} from 'react-native';

const LogoutButton = ({onLogout}) => {
  // Animated width for hover effect
  const widthAnim = useRef(new Animated.Value(45)).current;
  
  // State to track hover status
  const [hovering, setHovering] = useState(false);

  // Handle hover-in effect: expands button width and shows label
  const handleHoverIn = () => {
    setHovering(true);
    // Animate width expansion on hover
    Animated.timing(widthAnim, {
      toValue: 120,  // Expanded width
      duration: 300, 
      useNativeDriver: false,
    }).start();
  };

  // Handle hover-out effect: shrinks button back to original size
  const handleHoverOut = () => {
    setHovering(false);
    // Animate width contraction when hover ends
    Animated.timing(widthAnim, {
      toValue: 45,  // Original width
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      onPress={onLogout}           
      onHoverIn={handleHoverIn}    
      onHoverOut={handleHoverOut}  
      style={{ marginLeft: 10 }}>
        
      {/* Main Button View */}
      <Animated.View style={[styles.button, { width: widthAnim }]}>
        
        {/* Icon Section */}
        <View style={styles.iconWrapper}>
          <Image
            source={require('../../assets/logos/logout.png')} // Custom logout icon
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        {/* Only show text when hovering */}
        {hovering && <Text style={styles.text}>Logout</Text>}
      </Animated.View>
    </Pressable>
  );
};

// Styles for the button and components
const styles = StyleSheet.create({
  button: {
    height: 25,
    borderRadius: 40,
    backgroundColor: 'rgb(255, 65, 65)', 
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden', 
    paddingLeft: 10,
    elevation: 5, 
  },
  iconWrapper: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  icon: {
    width: 22,
    height: 22,
    color: 'black',
  },
});

export default LogoutButton;
