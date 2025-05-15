
import { useState, useEffect } from 'react';

export type UserSettings = {
  cutContourOffset: number;
  spotColorName: string;
};

export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // Default 3mm offset
  spotColorName: 'CutContour', // Default name
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Ensure spotColorName is not empty, fallback to 'CutContour'
        if (!parsedSettings.spotColorName || parsedSettings.spotColorName.trim() === '') {
          parsedSettings.spotColorName = defaultSettings.spotColorName;
        }
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return {
    settings,
    updateSettings,
  };
};
