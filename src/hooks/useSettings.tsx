
import { useState, useEffect } from 'react';
import {
  saveICCProfile,
  loadICCProfile,
  deleteICCProfile,
  ICCProfileMetadata
} from '@/utils/iccStorage';

export interface ICCProfile {
  id: string;
  name: string;
  fileName: string;
  filePath: string; // Path to file on disk (NOT Base64!)
  uploadedAt: Date;
  size: number; // File size in bytes
}

export type UserSettings = {
  // Cut Contour Settings (existing)
  cutContourOffset: number;
  spotColorName: string;

  // ICC Profile Settings (new)
  iccProfiles: ICCProfile[];
  defaultICCProfile: string | null; // filename of default profile

  // Color Space Settings (new)
  convertColorSpace: boolean; // Whether to convert uploaded PDFs
  targetColorSpace: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray'; // Target color space
  iccProfileMode: 'preserve' | 'convert'; // NEW: preserve original ICC or use settings ICC
};

export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // Default 3mm offset
  spotColorName: 'CUT', // Default name
  iccProfiles: [],
  defaultICCProfile: null,
  convertColorSpace: false,
  targetColorSpace: 'DeviceCMYK',
  iccProfileMode: 'preserve' // Default: keep original ICC profile
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

        // Migration: Filter out old ICC profiles that have 'data' field instead of 'filePath'
        if (parsed.iccProfiles) {
          const validProfiles = parsed.iccProfiles.filter((profile: any) => {
            // Only keep profiles with filePath (new format)
            if (profile.filePath) {
              return true;
            }
            // Log migration of old profiles
            console.log(`Migrating old ICC profile (will be removed): ${profile.fileName}`);
            return false;
          });

          parsed.iccProfiles = validProfiles.map((profile: any) => ({
            ...profile,
            uploadedAt: new Date(profile.uploadedAt)
          }));

          // Clear default profile if it was using old format
          if (parsed.defaultICCProfile && !validProfiles.find((p: any) => p.fileName === parsed.defaultICCProfile)) {
            console.log('Clearing old default ICC profile');
            parsed.defaultICCProfile = null;
          }
        }

        setSettings({ ...defaultSettings, ...parsed });
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
        localStorage.setItem('userSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);

        // If quota exceeded, show user-friendly message
        if (error instanceof Error &&
            (error.name === 'QuotaExceededError' ||
             error.message.includes('quota') ||
             error.message.includes('storage'))) {
          console.error('localStorage quota exceeded - ICC profiles too large');

          // Revert to previous settings without the failed profile
          // This prevents the white screen crash
          const storedSettings = localStorage.getItem('userSettings');
          if (storedSettings) {
            try {
              const previousSettings = JSON.parse(storedSettings);
              setSettings(previousSettings);
            } catch (parseError) {
              // If we can't restore, reset to defaults
              setSettings(defaultSettings);
            }
          }
        }
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

  const addICCProfile = async (file: File): Promise<void> => {
    try {
      // Save ICC profile to filesystem (handles all validation)
      const metadata: ICCProfileMetadata = await saveICCProfile(file);

      // Convert metadata to ICCProfile format
      const profile: ICCProfile = {
        id: metadata.id,
        name: metadata.name,
        fileName: metadata.fileName,
        filePath: metadata.filePath,
        uploadedAt: metadata.uploadedAt,
        size: metadata.size
      };

      const newProfiles = [...settings.iccProfiles, profile];

      const updates: Partial<UserSettings> = {
        iccProfiles: newProfiles
      };

      // Set as default if it's the first profile
      if (newProfiles.length === 1) {
        updates.defaultICCProfile = profile.fileName;
      }

      // Update settings (no size limits because we're not storing Base64!)
      updateSettings(updates);

      console.log(`ICC profile added successfully: ${profile.fileName} (${(profile.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error('Error adding ICC profile:', error);
      throw error;
    }
  };

  const removeICCProfile = async (profileId: string) => {
    try {
      // Find the profile to delete
      const removedProfile = settings.iccProfiles.find(p => p.id === profileId);
      if (!removedProfile) return;

      // Delete file from filesystem
      await deleteICCProfile(removedProfile.filePath);

      // Update settings
      const newProfiles = settings.iccProfiles.filter(p => p.id !== profileId);
      const updates: Partial<UserSettings> = { iccProfiles: newProfiles };

      // Clear default if it was the removed profile
      if (settings.defaultICCProfile === removedProfile.fileName) {
        updates.defaultICCProfile = null;
      }

      updateSettings(updates);

      console.log(`ICC profile removed: ${removedProfile.fileName}`);
    } catch (error) {
      console.error('Error removing ICC profile:', error);
      // Still update settings even if file deletion fails
      const newProfiles = settings.iccProfiles.filter(p => p.id !== profileId);
      updateSettings({ iccProfiles: newProfiles });
    }
  };

  const setDefaultICCProfile = (fileName: string | null) => {
    updateSettings({ defaultICCProfile: fileName });
  };

  const getICCProfileData = async (fileName: string): Promise<string | null> => {
    try {
      const profile = settings.iccProfiles.find(p => p.fileName === fileName);
      if (!profile) return null;

      // Load ICC profile from filesystem
      const base64Data = await loadICCProfile(profile.filePath);
      return base64Data;
    } catch (error) {
      console.error('Error loading ICC profile data:', error);
      return null;
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    isLoading,
    updateSettings,
    updateSetting,
    addICCProfile,
    removeICCProfile,
    setDefaultICCProfile,
    getICCProfileData,
    resetSettings,
  };
};
