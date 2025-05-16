
import { useState, useEffect } from 'react';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';

const STORAGE_KEY = 'printPlateSettings';

const DEFAULT_PLATE_SIZE: PrintPlateSize = {
  width: 60,
  height: 40
};

export const usePrintPlateState = () => {
  const [plateSize, setPlateSize] = useState<PrintPlateSize>(DEFAULT_PLATE_SIZE);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.width > 0 && parsedSettings.height > 0) {
          setPlateSize(parsedSettings);
        }
      } catch (error) {
        console.error('Error parsing stored print plate settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plateSize));
  }, [plateSize]);

  return {
    plateSize,
    setPlateSize,
  };
};
