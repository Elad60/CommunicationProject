import {useState, useEffect} from 'react';
import {Dimensions} from 'react-native';

export const useDebouncedDimensions = (delay = 0) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);

      const newTimeout = setTimeout(() => {
        setDimensions(Dimensions.get('window'));
      }, delay);

      setTimeoutId(newTimeout);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.remove?.();
    };
  }, [timeoutId, delay]);

  return dimensions;
};
