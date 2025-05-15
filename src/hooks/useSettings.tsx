
import { useState, useEffect } from 'react';

export type UserSettings = {
  cutContourOffset: number;
  spotColorName: string;
};

// Default "CutContour" is Adobe Illustrator's standard spot color name for die cuts
export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // 3mm offset
  spotColorName: 'CutContour', // Adobe standard name
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [initialized, setInitialized] = useState(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Always preserve the spot color name exactly as stored
        setSettings({
          cutContourOffset: parsedSettings.cutContourOffset || defaultSettings.cutContourOffset,
          spotColorName: parsedSettings.spotColorName || defaultSettings.spotColorName
        });
      }
      setInitialized(true);
    } catch (error) {
      console.error('Error parsing stored settings:', error);
      setInitialized(true);
    }
  }, []);

  // Save settings to localStorage whenever they change, but only after initial load
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  }, [settings, initialized]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
      // Preserve the exact spot color name without modification
      spotColorName: newSettings.spotColorName !== undefined ? 
        newSettings.spotColorName : 
        prevSettings.spotColorName
    }));
  };

  return {
    settings,
    updateSettings,
  };
};
