
import { useState, useEffect } from 'react';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';

const STORAGE_KEY = 'printPlateSettings';

const DEFAULT_PLATE_SIZE: PrintPlateSize = {
  width: 60,
  height: 40
};

export const usePrintPlateState = () => {
  const [plateSize, setPlateSize] = useState<PrintPlateSize>(DEFAULT_PLATE_SIZE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings && 
            typeof parsedSettings.width === 'number' && 
            typeof parsedSettings.height === 'number' && 
            parsedSettings.width > 0 && 
            parsedSettings.height > 0) {
          
          setPlateSize({
            width: parsedSettings.width,
            height: parsedSettings.height
          });
        }
      }
    } catch (error) {
      console.error('Error loading print plate settings:', error);
      // Fallback to default settings if error
      setPlateSize(DEFAULT_PLATE_SIZE);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Only save if we've loaded the initial settings to prevent
    // overwriting with defaults before loading
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plateSize));
      } catch (error) {
        console.error('Error saving print plate settings:', error);
      }
    }
  }, [plateSize, isLoaded]);

  return {
    plateSize,
    setPlateSize,
    isLoaded
  };
};
