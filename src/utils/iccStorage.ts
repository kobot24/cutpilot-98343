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
  filePath: string; // RELATIVE path within AppData (e.g., "icc_profiles/123_profile.icc")
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
 * FALLBACK: If filesystem save fails, falls back to localStorage (with size warnings)
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
    try {
      await tauriFs.writeBinaryFile(relativePath, uint8Array, {
        dir: tauriFs.BaseDirectory.AppData
      });
      console.log('[saveICCProfile] File written successfully to filesystem!');
    } catch (fsError) {
      console.error('[saveICCProfile] Filesystem write failed:', fsError);
      console.warn('[saveICCProfile] FALLBACK: Attempting localStorage save (not recommended for large files)');

      // FALLBACK: Try localStorage (with warnings)
      if (file.size > 1024 * 1024) { // > 1MB
        console.error('[saveICCProfile] ICC Profile too large for localStorage fallback (>1MB)');
        throw new Error('Dateisystem-Speicherung fehlgeschlagen und Profil zu groß für localStorage (>1MB). Bitte Berechtigungen prüfen.');
      }

      // Convert to Base64 for localStorage
      const base64 = btoa(
        Array.from(uint8Array)
          .map(byte => String.fromCharCode(byte))
          .join('')
      );

      // Store in localStorage with special prefix
      const localStorageKey = `icc_fallback_${timestamp}`;
      try {
        localStorage.setItem(localStorageKey, base64);
        console.warn(`[saveICCProfile] Stored in localStorage as fallback: ${localStorageKey}`);

        // Return metadata with fallback marker
        const metadata: ICCProfileMetadata = {
          id: `icc_${timestamp}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          filePath: `__FALLBACK_LOCALSTORAGE__${localStorageKey}`, // Special marker
          uploadedAt: new Date(),
          size: file.size
        };

        return metadata;
      } catch (localStorageError) {
        console.error('[saveICCProfile] localStorage fallback also failed:', localStorageError);
        throw new Error('Weder Dateisystem noch localStorage verfügbar. Bitte Anwendung neu starten.');
      }
    }

    // Return metadata with RELATIVE path (not absolute!)
    // This allows us to use BaseDirectory.AppData when reading/deleting
    const metadata: ICCProfileMetadata = {
      id: `icc_${timestamp}`,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      fileName: file.name,
      filePath: relativePath, // Store RELATIVE path (e.g., "icc_profiles/123_profile.icc")
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
 * @param filePath - RELATIVE path within AppData (e.g., "icc_profiles/123_profile.icc")
 *                   OR localStorage key with prefix "__FALLBACK_LOCALSTORAGE__"
 */
export async function loadICCProfile(filePath: string): Promise<string> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    // Check if this is a localStorage fallback
    if (filePath.startsWith('__FALLBACK_LOCALSTORAGE__')) {
      const localStorageKey = filePath.replace('__FALLBACK_LOCALSTORAGE__', '');
      console.log('[loadICCProfile] Loading from localStorage fallback:', localStorageKey);

      const base64 = localStorage.getItem(localStorageKey);
      if (!base64) {
        throw new Error(`localStorage key not found: ${localStorageKey}`);
      }

      console.log('[loadICCProfile] Loaded from localStorage, size:', base64.length);
      return base64;
    }

    // Normal filesystem load
    console.log('[loadICCProfile] Loading ICC profile from relative path:', filePath);

    // Read binary file using RELATIVE path with BaseDirectory.AppData
    const uint8Array = await tauriFs.readBinaryFile(filePath, {
      dir: tauriFs.BaseDirectory.AppData
    });

    console.log('[loadICCProfile] File loaded successfully, size:', uint8Array.length);

    // Convert to Base64
    const base64 = btoa(
      Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );

    return base64;
  } catch (error) {
    console.error('[loadICCProfile] Error loading ICC profile:', error);
    throw new Error(`Fehler beim Laden des ICC-Profils: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Delete an ICC profile from the filesystem
 * @param filePath - RELATIVE path within AppData (e.g., "icc_profiles/123_profile.icc")
 *                   OR localStorage key with prefix "__FALLBACK_LOCALSTORAGE__"
 */
export async function deleteICCProfile(filePath: string): Promise<void> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    // Check if this is a localStorage fallback
    if (filePath.startsWith('__FALLBACK_LOCALSTORAGE__')) {
      const localStorageKey = filePath.replace('__FALLBACK_LOCALSTORAGE__', '');
      console.log('[deleteICCProfile] Deleting from localStorage fallback:', localStorageKey);

      localStorage.removeItem(localStorageKey);
      console.log('[deleteICCProfile] Removed from localStorage:', localStorageKey);
      return;
    }

    // Normal filesystem deletion
    console.log('[deleteICCProfile] Deleting ICC profile at relative path:', filePath);

    // Delete file using RELATIVE path with BaseDirectory.AppData
    await tauriFs.removeFile(filePath, {
      dir: tauriFs.BaseDirectory.AppData
    });

    console.log('[deleteICCProfile] ICC profile deleted successfully:', filePath);
  } catch (error) {
    console.error('[deleteICCProfile] Error deleting ICC profile:', error);
    throw new Error(`Fehler beim Löschen des ICC-Profils: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Check if an ICC profile file exists
 * @param filePath - RELATIVE path within AppData (e.g., "icc_profiles/123_profile.icc")
 */
export async function iccProfileExists(filePath: string): Promise<boolean> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs) {
    return false;
  }

  try {
    // Check if file exists using RELATIVE path with BaseDirectory.AppData
    await tauriFs.readBinaryFile(filePath, {
      dir: tauriFs.BaseDirectory.AppData
    });
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
