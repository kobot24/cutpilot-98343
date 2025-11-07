/**
 * Tauri File Dialog Integration
 * Provides native file dialogs for opening and saving files
 */

import { isTauri } from './tauri';

// Import Tauri APIs only when running in Tauri context
let dialog: any = null;
let fs: any = null;
let path: any = null;

// Lazy load Tauri APIs
const loadTauriAPIs = async () => {
  if (!isTauri()) return;

  if (!dialog) {
    try {
      const tauriDialog = await import('@tauri-apps/api/dialog');
      const tauriFs = await import('@tauri-apps/api/fs');
      const tauriPath = await import('@tauri-apps/api/path');

      dialog = tauriDialog;
      fs = tauriFs;
      path = tauriPath;
    } catch (error) {
      console.error('Failed to load Tauri APIs:', error);
    }
  }
};

/**
 * Open file dialog to select PDF or image files
 */
export const openFileDialog = async (options: {
  multiple?: boolean;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<string | string[] | null> => {
  if (!isTauri()) {
    console.warn('openFileDialog called outside Tauri context');
    return null;
  }

  await loadTauriAPIs();

  if (!dialog) {
    console.error('Tauri dialog API not available');
    return null;
  }

  try {
    const result = await dialog.open({
      multiple: options.multiple ?? false,
      filters: options.filters ?? [
        {
          name: 'PDF & Images',
          extensions: ['pdf', 'jpg', 'jpeg', 'png']
        },
        {
          name: 'PDF Files',
          extensions: ['pdf']
        },
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff']
        },
        {
          name: 'ICC Profiles',
          extensions: ['icc', 'icm']
        }
      ],
      title: 'Dateien auswählen'
    });

    return result;
  } catch (error) {
    console.error('Error opening file dialog:', error);
    return null;
  }
};

/**
 * Open save dialog to save PDF file
 */
export const saveFileDialog = async (options: {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<string | null> => {
  if (!isTauri()) {
    console.warn('saveFileDialog called outside Tauri context');
    return null;
  }

  await loadTauriAPIs();

  if (!dialog) {
    console.error('Tauri dialog API not available');
    return null;
  }

  try {
    const result = await dialog.save({
      defaultPath: options.defaultPath,
      filters: options.filters ?? [
        {
          name: 'PDF Files',
          extensions: ['pdf']
        }
      ],
      title: 'PDF speichern'
    });

    return result;
  } catch (error) {
    console.error('Error opening save dialog:', error);
    return null;
  }
};

/**
 * Read file from filesystem
 */
export const readBinaryFile = async (filePath: string): Promise<Uint8Array | null> => {
  if (!isTauri()) {
    console.warn('readBinaryFile called outside Tauri context');
    return null;
  }

  await loadTauriAPIs();

  if (!fs) {
    console.error('Tauri fs API not available');
    return null;
  }

  try {
    const contents = await fs.readBinaryFile(filePath);
    return contents;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
};

/**
 * Write binary file to filesystem
 */
export const writeBinaryFile = async (
  filePath: string,
  contents: Uint8Array | ArrayBuffer
): Promise<boolean> => {
  if (!isTauri()) {
    console.warn('writeBinaryFile called outside Tauri context');
    return false;
  }

  await loadTauriAPIs();

  if (!fs) {
    console.error('Tauri fs API not available');
    return false;
  }

  try {
    const uint8Array = contents instanceof ArrayBuffer
      ? new Uint8Array(contents)
      : contents;

    await fs.writeBinaryFile(filePath, uint8Array);
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
};

/**
 * Get download directory path
 */
export const getDownloadDir = async (): Promise<string | null> => {
  if (!isTauri()) return null;

  await loadTauriAPIs();

  if (!path) {
    console.error('Tauri path API not available');
    return null;
  }

  try {
    return await path.downloadDir();
  } catch (error) {
    console.error('Error getting download directory:', error);
    return null;
  }
};

/**
 * Get document directory path
 */
export const getDocumentDir = async (): Promise<string | null> => {
  if (!isTauri()) return null;

  await loadTauriAPIs();

  if (!path) {
    console.error('Tauri path API not available');
    return null;
  }

  try {
    return await path.documentDir();
  } catch (error) {
    console.error('Error getting document directory:', error);
    return null;
  }
};

/**
 * Convert file path to file URL for preview
 */
export const convertFilePath = async (filePath: string): Promise<string> => {
  if (!isTauri()) return filePath;

  await loadTauriAPIs();

  if (!path || !fs) {
    return filePath;
  }

  try {
    // For Tauri, we need to read the file and create a blob URL
    const contents = await readBinaryFile(filePath);
    if (!contents) return filePath;

    // Detect file type from extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';

    if (extension === 'pdf') {
      mimeType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(extension ?? '')) {
      mimeType = 'image/jpeg';
    } else if (extension === 'png') {
      mimeType = 'image/png';
    }

    const blob = new Blob([contents], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting file path:', error);
    return filePath;
  }
};
