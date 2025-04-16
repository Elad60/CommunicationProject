import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

const TutorialTooltip = ({text, onNext, step, totalSteps}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.tooltipBox}>
        <Text style={{color: 'black', fontSize: 18}}>
          🚀 Step {step}: {text}
        </Text>

        <TouchableOpacity onPress={onNext} style={styles.button}>
          <Text style={styles.buttonText}>
            {step === totalSteps ? 'Got it' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
    zIndex: 9999,
  },
  tooltipBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TutorialTooltip;
