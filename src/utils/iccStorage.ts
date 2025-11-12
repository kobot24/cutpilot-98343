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
 * Get the ICC profiles directory path
 */
async function getICCProfilesDir(): Promise<string> {
  await ensureTauriImports();

  if (!isTauri() || !tauriPath) {
    throw new Error('Tauri filesystem not available');
  }

  const appDataDir = await tauriPath.appDataDir();
  const iccDir = await tauriPath.join(appDataDir, ICC_PROFILES_DIR);

  // Create directory if it doesn't exist
  try {
    await tauriFs.createDir(iccDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }

  return iccDir;
}

/**
 * Save an ICC profile to the filesystem
 */
export async function saveICCProfile(file: File): Promise<ICCProfileMetadata> {
  await ensureTauriImports();

  if (!isTauri() || !tauriFs || !tauriPath) {
    throw new Error('Diese Funktion ist nur in der Desktop-Version verfügbar');
  }

  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.icc') && !file.name.toLowerCase().endsWith('.icm')) {
      throw new Error('Ungültiger Dateityp. Bitte wählen Sie eine .icc oder .icm Datei.');
    }

    // Get ICC profiles directory
    const iccDir = await getICCProfilesDir();

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${safeFileName}`;
    const filePath = await tauriPath.join(iccDir, uniqueFileName);

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write to filesystem using Tauri fs API
    await tauriFs.writeBinaryFile(filePath, uint8Array);

    console.log(`ICC profile saved to: ${filePath}`);

    // Return metadata (no Base64 data!)
    const metadata: ICCProfileMetadata = {
      id: `icc_${timestamp}`,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      fileName: file.name,
      filePath: filePath,
      uploadedAt: new Date(),
      size: file.size
    };

    return metadata;
  } catch (error) {
    console.error('Error saving ICC profile:', error);
    throw new Error(`Fehler beim Speichern des ICC-Profils: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
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
