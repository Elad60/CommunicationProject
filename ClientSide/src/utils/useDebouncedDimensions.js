import {useState, useEffect, useRef} from 'react';
import {Dimensions} from 'react-native';

// Custom hook to get debounced screen dimensions (on orientation/size change)
export const useDebouncedDimensions = (delay = 0) => {
  // Current dimensions of the screen
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  // Store timeout ID to clear if needed - using useRef to avoid infinite loop
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    // Called when dimensions change
    const handleResize = () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current); // Clear previous timeout

      // Set a new timeout to update dimensions after the delay
      const newTimeout = setTimeout(() => {
        setDimensions(Dimensions.get('window'));
      }, delay);

      timeoutIdRef.current = newTimeout;
    };

    // Listen to dimension changes (e.g. screen rotation)
    const subscription = Dimensions.addEventListener('change', handleResize);

    // Clean up listener and timeout on unmount
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      subscription?.remove?.();
    };
  }, [delay]); // ✅ FIXED: Removed timeoutId from dependencies

  // Return the debounced dimensions
  return dimensions;
};
