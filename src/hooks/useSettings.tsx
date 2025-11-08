
import { useState, useEffect } from 'react';

export interface ICCProfile {
  id: string;
  name: string;
  fileName: string;
  data: string; // Base64 encoded ICC profile data
  uploadedAt: Date;
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
};

export const defaultSettings: UserSettings = {
  cutContourOffset: 3, // Default 3mm offset
  spotColorName: 'CUT', // Default name
  iccProfiles: [],
  defaultICCProfile: null,
  convertColorSpace: false,
  targetColorSpace: 'DeviceCMYK'
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
        // Convert date strings back to Date objects
        if (parsed.iccProfiles) {
          parsed.iccProfiles = parsed.iccProfiles.map((profile: any) => ({
            ...profile,
            uploadedAt: new Date(profile.uploadedAt)
          }));
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
      localStorage.setItem('userSettings', JSON.stringify(settings));
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
      // Read file as base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data URL prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const profile: ICCProfile = {
        id: `icc_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        fileName: file.name,
        data: base64Data,
        uploadedAt: new Date()
      };

      const newProfiles = [...settings.iccProfiles, profile];
      updateSettings({ iccProfiles: newProfiles });

      // Set as default if it's the first profile
      if (newProfiles.length === 1) {
        updateSettings({ defaultICCProfile: profile.fileName });
      }
    } catch (error) {
      console.error('Error adding ICC profile:', error);
      throw error;
    }
  };

  const removeICCProfile = (profileId: string) => {
    const newProfiles = settings.iccProfiles.filter(p => p.id !== profileId);
    updateSettings({ iccProfiles: newProfiles });

    // Clear default if it was the removed profile
    const removedProfile = settings.iccProfiles.find(p => p.id === profileId);
    if (removedProfile && settings.defaultICCProfile === removedProfile.fileName) {
      updateSettings({ defaultICCProfile: null });
    }
  };

  const setDefaultICCProfile = (fileName: string | null) => {
    updateSettings({ defaultICCProfile: fileName });
  };

  const getICCProfileData = (fileName: string): string | null => {
    const profile = settings.iccProfiles.find(p => p.fileName === fileName);
    return profile ? profile.data : null;
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
