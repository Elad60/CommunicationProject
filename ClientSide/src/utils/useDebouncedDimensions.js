import {useState, useEffect} from 'react';
import {Dimensions} from 'react-native';

// Custom hook to get debounced screen dimensions (on orientation/size change)
export const useDebouncedDimensions = (delay = 0) => {
  // Current dimensions of the screen
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  // Store timeout ID to clear if needed
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Called when dimensions change
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId); // Clear previous timeout

      // Set a new timeout to update dimensions after the delay
      const newTimeout = setTimeout(() => {
        setDimensions(Dimensions.get('window'));
      }, delay);

      setTimeoutId(newTimeout);
    };

    // Listen to dimension changes (e.g. screen rotation)
    const subscription = Dimensions.addEventListener('change', handleResize);

    // Clean up listener and timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.remove?.();
    };
  }, [timeoutId, delay]);

  // Return the debounced dimensions
  return dimensions;
};
