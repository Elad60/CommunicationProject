import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TutorialContext = createContext();

export const TutorialProvider = ({children}) => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTutorialState = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenTutorial');
        setHasSeenTutorial(value === 'true');
      } catch (err) {
        console.error('Error reading tutorial flag:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTutorialState();
  }, []);

  const markTutorialSeen = async () => {
    setHasSeenTutorial(true);
    await AsyncStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <TutorialContext.Provider
      value={{hasSeenTutorial, markTutorialSeen, loading}}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => useContext(TutorialContext);
