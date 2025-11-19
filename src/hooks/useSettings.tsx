
import { useState, useEffect } from 'react';
import {
  selectICCProfilePath,
  getICCProfilePath,
  clearICCProfilePath,
  hasICCProfilePath,
  getICCProfileFileName
} from '@/utils/iccProfileSelector';

/**
 * Vereinfachte Settings - "Lokal denken"
 *
 * KEINE komplexen ICC-Profile-Listen mehr!
 * Nur ein Pfad zum ICC-Profil (optional).
 */
export type UserSettings = {
  // Cut Contour Settings
  cutContourOffset: number;
  spotColorName: string;

  // ICC Profile Path (optional - nur für Ghostscript CMYK-Konvertierung)
  // Wird NUR verwendet wenn User explizit CMYK-Konvertierung aktiviert
  iccProfilePath: string | null;
};

export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // Default 3mm offset
  spotColorName: 'CUT', // Default name
  iccProfilePath: null // Kein ICC-Profil standardmäßig
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);

        // Migration: Load ICC profile path from iccProfileSelector
        // (ignores old complex iccProfiles array)
        const iccProfilePath = getICCProfilePath();

        setSettings({
          ...defaultSettings,
          ...parsed,
          iccProfilePath // Override with path from iccProfileSelector
        });
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        // iccProfilePath wird NICHT in localStorage gespeichert
        // (wird separat von iccProfileSelector verwaltet)
        const { iccProfilePath, ...settingsToSave } = settings;

        localStorage.setItem('userSettings', JSON.stringify(settingsToSave));
        console.log('[useSettings] Settings gespeichert:', settingsToSave);
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    }
  }, [settings, isLoading]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Helper function to update a single setting
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    updateSettings({ [key]: value } as Partial<UserSettings>);
  };

  /**
   * Öffnet Datei-Dialog zur Auswahl eines ICC-Profils
   * EINFACH: Nur Pfad auswählen, keine Uploads!
   */
  const selectICCProfile = async (): Promise<void> => {
    try {
      const path = await selectICCProfilePath();
      if (path) {
        updateSettings({ iccProfilePath: path });
        console.log('[useSettings] ICC-Profil ausgewählt:', path);
      }
    } catch (error) {
      console.error('[useSettings] Fehler bei ICC-Profil-Auswahl:', error);
      throw error;
    }
  };

  /**
   * Löscht das ausgewählte ICC-Profil (nur den Pfad, nicht die Datei!)
   */
  const removeICCProfile = () => {
    clearICCProfilePath();
    updateSettings({ iccProfilePath: null });
    console.log('[useSettings] ICC-Profil entfernt');
  };

  /**
   * Gibt Dateinamen des ICC-Profils zurück (für Anzeige)
   */
  const getCurrentICCProfileName = (): string | null => {
    if (!settings.iccProfilePath) return null;
    return getICCProfileFileName(settings.iccProfilePath);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    clearICCProfilePath();
  };

  return {
    settings,
    isLoading,
    updateSettings,
    updateSetting,
    selectICCProfile,
    removeICCProfile,
    getCurrentICCProfileName,
    resetSettings,
  };
};
