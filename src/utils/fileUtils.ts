
// Helper functions for file operations

import { FILE_STORAGE_LIMITS } from "../constants/fileStorage";

/**
 * Reads a file and returns a data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For large files, use blob URLs directly for better memory management
    if (file.size > FILE_STORAGE_LIMITS.LARGE_FILE_THRESHOLD_BYTES) {
      const blob = new Blob([file], { type: file.type });
      const url = URL.createObjectURL(blob);
      resolve(url);
      return;
    }
    
    // For smaller files, use traditional FileReader
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a unique ID that's more collision-resistant
 */
export const generateId = (): string => {
  // Improved ID generation to avoid collisions
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const secondRandom = Math.random().toString(36).substring(2, 6);
  
  // Combine parts for better uniqueness
  return `${timestamp}-${randomPart}-${secondRandom}`;
};

/**
 * Revokes a blob URL safely
 */
export const revokeBlobUrl = (url?: string): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
