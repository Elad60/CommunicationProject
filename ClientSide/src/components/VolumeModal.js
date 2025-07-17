import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import CustomSlider from './CustomSlider';

const {width, height} = Dimensions.get('window');

const getStyles = darkMode =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    modalContent: {
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      borderRadius: 16,
      padding: 28,
      width: width * 0.9,
      maxWidth: 400,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: darkMode ? '#333' : '#ccc',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowOffset: {width: 0, height: 4},
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#222',
      marginBottom: 10,
    },
    value: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 10,
      letterSpacing: 1,
      color: darkMode ? '#1DB954' : '#1976d2',
    },
    sliderContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: 24,
      width: '100%',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      marginHorizontal: 8,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: darkMode ? '#333' : '#eee',
    },
    setButton: {
      backgroundColor: darkMode ? '#1DB954' : '#1976d2',
    },
    cancelText: {
      color: darkMode ? '#fff' : '#222',
      fontWeight: 'bold',
    },
    setText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 16,
      padding: 8,
      zIndex: 10,
    },
    closeButtonText: {
      fontSize: 24,
      color: darkMode ? '#888' : '#aaa',
    },
  });

const VolumeModal = ({
  visible,
  initialValue = 1,
  onCancel,
  onSet,
  darkMode,
}) => {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, visible]);
  const styles = getStyles(darkMode);
  // Convert slider value [0-1] to volume [0-100]
  const volume = Math.round(value * 100);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.modalContent}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        {/* Title */}
        <Text style={styles.title}>Set Channel Volume</Text>
        {/* Value */}
        <Text style={styles.value}>{volume}</Text>
        {/* Slider */}
        <View style={styles.sliderContainer}>
          <CustomSlider
            value={value}
            onValueChange={setValue}
            label="Volume"
            darkMode={darkMode}
          />
        </View>
        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.setButton]}
            onPress={() => onSet(volume)}>
            <Text style={styles.setText}>Set</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VolumeModal;
