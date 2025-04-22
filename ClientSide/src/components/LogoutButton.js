import React, {useRef, useState} from 'react';
import {Animated, Text, StyleSheet, View, Pressable, Image} from 'react-native';

const LogoutButton = ({onLogout}) => {
  // Animated width for hover effect
  const widthAnim = useRef(new Animated.Value(45)).current;
  const [hovering, setHovering] = useState(false);

  const handleHoverIn = () => {
    setHovering(true);
    // Animate width expansion on hover
    Animated.timing(widthAnim, {
      toValue: 120,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleHoverOut = () => {
    setHovering(false);
    // Animate width contraction when hover ends
    Animated.timing(widthAnim, {
      toValue: 45,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      onPress={onLogout}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={{marginLeft: 10}}>
      <Animated.View style={[styles.button, {width: widthAnim}]}>
        <View style={styles.iconWrapper}>
          <Image
            source={require('../../assets/logos/logout.png')}
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
