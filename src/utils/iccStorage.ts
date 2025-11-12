/**
 * ICC Profile Storage Utilities for Tauri Desktop App
 *
 * Stores ICC profiles in the filesystem (not localStorage) to avoid size limits.
 * Uses Tauri's fs API for desktop, falls back to IndexedDB for browser.
 */

import { isTauri } from './tauri';

// Lazy-load Tauri APIs
let tauriFs: any = null;
let tauriPath: any = null;
let tauriImportsLoaded = false;

async function ensureTauriImports() {
  if (tauriImportsLoaded) return;

  if (isTauri()) {
    try {
      tauriFs = await import('@tauri-apps/api/fs');
      tauriPath = await import('@tauri-apps/api/path');
      tauriImportsLoaded = true;
    } catch (error) {
      console.error('Failed to import Tauri APIs:', error);
    }
  }
}

export interface ICCProfileMetadata {
  id: string;
  name: string;
  fileName: string;
  filePath: string; // Path to the actual file on disk
  uploadedAt: Date;
  size: number; // File size in bytes
}

const ICC_PROFILES_DIR = 'icc_profiles';

/**
 * Ensure ICC profiles directory exists
 */
async function ensureICCProfilesDir(): Promise<void> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    throw new Error('Tauri filesystem not available');
  }

  // Create directory if it doesn't exist
  // Using BaseDirectory.AppData for proper path resolution
  try {
    console.log('[ensureICCProfilesDir] Creating directory:', ICC_PROFILES_DIR);
    await tauriFs.createDir(ICC_PROFILES_DIR, {
      dir: tauriFs.BaseDirectory.AppData,
      recursive: true
    });
    console.log('[ensureICCProfilesDir] Directory created/verified');
  } catch (error) {
    console.log('[ensureICCProfilesDir] Directory might already exist:', error);
    // Directory might already exist, ignore error
  }
}

/**
 * Save an ICC profile to the filesystem
 */
export async function saveICCProfile(file: File): Promise<ICCProfileMetadata> {
  console.log('[saveICCProfile] Starting ICC profile save:', file.name, `(${file.size} bytes)`);

  await ensureTauriImports();
  console.log('[saveICCProfile] Tauri imports loaded:', {
    isTauri: isTauri(),
    hasTauriFs: !!tauriFs,
    hasTauriPath: !!tauriPath
  });

  if (!isTauri() || !tauriFs || !tauriPath) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.icc') && !file.name.toLowerCase().endsWith('.icm')) {
      throw new Error('Ungültiger Dateityp. Bitte wählen Sie eine .icc oder .icm Datei.');
    }

    // Ensure ICC profiles directory exists
    console.log('[saveICCProfile] Ensuring ICC profiles directory exists...');
    await ensureICCProfilesDir();

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${safeFileName}`;
    console.log('[saveICCProfile] Generated filename:', uniqueFileName);

    // Relative path within AppData directory
    const relativePath = `${ICC_PROFILES_DIR}/${uniqueFileName}`;
    console.log('[saveICCProfile] Relative path:', relativePath);

    // Read file as array buffer
    console.log('[saveICCProfile] Reading file as array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('[saveICCProfile] Array buffer size:', uint8Array.length);

    // Write to filesystem using Tauri fs API with BaseDirectory
    console.log('[saveICCProfile] Writing binary file to disk...');
    await tauriFs.writeBinaryFile(relativePath, uint8Array, {
      dir: tauriFs.BaseDirectory.AppData
    });
    console.log('[saveICCProfile] File written successfully!');

    // Get the absolute path for metadata
    const appDataDir = await tauriPath.appDataDir();
    const absolutePath = await tauriPath.join(appDataDir, relativePath);
    console.log('[saveICCProfile] Absolute path:', absolutePath);

    // Return metadata (no Base64 data!)
    const metadata: ICCProfileMetadata = {
      id: `icc_${timestamp}`,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      fileName: file.name,
      filePath: absolutePath, // Store absolute path for later retrieval
      uploadedAt: new Date(),
      size: file.size
    };

    console.log('[saveICCProfile] Returning metadata:', metadata);
    return metadata;
  } catch (error) {
    console.error('[saveICCProfile] ERROR:', error);
    console.error('[saveICCProfile] Error type:', typeof error);
    console.error('[saveICCProfile] Error stack:', error instanceof Error ? error.stack : 'No stack');

    // More detailed error message
    let errorMessage = 'Unbekannter Fehler';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[saveICCProfile] Error message:', errorMessage);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    throw new Error(`Fehler beim Speichern des ICC-Profils: ${errorMessage}`);
  }
}

/**
 * Load an ICC profile from the filesystem as Base64
 */
export async function loadICCProfile(filePath: string): Promise<string> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    // Read binary file
    const uint8Array = await tauriFs.readBinaryFile(filePath);

    // Convert to Base64
    const base64 = btoa(
      Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );

    return base64;
  } catch (error) {
    console.error('Error loading ICC profile:', error);
    throw new Error(`Fehler beim Laden des ICC-Profils: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Delete an ICC profile from the filesystem
 */
export async function deleteICCProfile(filePath: string): Promise<void> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    await tauriFs.removeFile(filePath);
    console.log(`ICC profile deleted: ${filePath}`);
  } catch (error) {
    console.error('Error deleting ICC profile:', error);
    throw new Error(`Fehler beim Löschen des ICC-Profils: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Check if an ICC profile file exists
 */
export async function iccProfileExists(filePath: string): Promise<boolean> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    return false;
  }

  try {
    await tauriFs.readBinaryFile(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the size of all ICC profiles
 */
export async function getICCProfilesSize(profiles: ICCProfileMetadata[]): Promise<number> {
  return profiles.reduce((total, profile) => total + profile.size, 0);
}
