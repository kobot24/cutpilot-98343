
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
 * Generates a random ID with high uniqueness guarantee
 */
export const generateId = (): string => {
  // Use a more robust ID generation approach combining timestamp with random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const additionalRandom = Math.random().toString(36).substring(2, 6);
  
  return `${timestamp}-${randomPart}-${additionalRandom}`;
};

/**
 * Revokes a blob URL safely
 */
export const revokeBlobUrl = (url?: string): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
