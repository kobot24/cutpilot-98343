
import { useState, useEffect } from 'react';

export type UserSettings = {
  cutContourOffset: number;
  spotColorName: string;
};

export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // Default 3mm offset
  spotColorName: 'CutContour', // Default name - always use CutContour
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Always ensure CutContour as spot color name
        parsedSettings.spotColorName = 'CutContour';
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Always ensure CutContour before saving
    const settingsToSave = {
      ...settings,
      spotColorName: 'CutContour'
    };
    localStorage.setItem('userSettings', JSON.stringify(settingsToSave));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
      // Always ensure CutContour
      spotColorName: 'CutContour'
    }));
  };

  return {
    settings,
    updateSettings,
  };
};
