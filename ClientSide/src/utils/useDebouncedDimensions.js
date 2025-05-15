import {useState, useEffect} from 'react';
import {Dimensions} from 'react-native';

// Custom hook that returns screen dimensions with optional debounce
export const useDebouncedDimensions = (delay = 0) => {
  // Store current screen dimensions
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Store timeout ID to manage debouncing
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Handler that runs on dimension change, with debounce
    const handleResize = () => {
      if (timeoutId) {clearTimeout(timeoutId);} // Clear existing timeout if any

      // Set a new timeout to update dimensions after the delay
      const newTimeout = setTimeout(() => {
        setDimensions(Dimensions.get('window')); // Update dimensions after delay
      }, delay);

      setTimeoutId(newTimeout); // Save new timeout ID
    };

    // Subscribe to dimension change events
    const subscription = Dimensions.addEventListener('change', handleResize);

    // Clean up on unmount or dependency change
    return () => {
      if (timeoutId) {clearTimeout(timeoutId);}
      subscription?.remove?.(); // Remove listener if exists
    };
  }, [timeoutId, delay]);

  // Return the debounced dimensions
  return dimensions;
};
