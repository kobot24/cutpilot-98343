/**
 * ICC Profile Path Selector
 *
 * Einfache Pfad-Auswahl für ICC-Profile - KEIN Upload, KEINE Speicherung!
 * Nur der Pfad wird gespeichert und direkt verwendet.
 *
 * Philosophy: "Lokal denken" - Datei bleibt wo sie ist, wir merken uns nur den Pfad.
 */

import { open as openFileDialog } from '@tauri-apps/api/dialog';
import { isTauri } from './tauri';

const ICC_PROFILE_PATH_KEY = 'icc_profile_path';

/**
 * Öffnet Datei-Dialog zur Auswahl eines ICC-Profils
 *
 * @returns Promise<string | null> - Pfad zum ausgewählten ICC-Profil oder null
 *
 * @example
 * const path = await selectICCProfilePath();
 * if (path) {
 *   console.log('ICC-Profil ausgewählt:', path);
 * }
 */
export async function selectICCProfilePath(): Promise<string | null> {
  if (!isTauri()) {
    console.error('[selectICCProfilePath] Nur in Tauri-App verfügbar');
    return null;
  }

  try {
    console.log('[selectICCProfilePath] Öffne Datei-Dialog...');

    const selected = await openFileDialog({
      title: 'ICC-Profil auswählen',
      filters: [
        {
          name: 'ICC Profile',
          extensions: ['icc', 'icm']
        }
      ],
      multiple: false,
      directory: false,
    });

    // openFileDialog kann string | string[] | null zurückgeben
    const path = Array.isArray(selected) ? selected[0] : selected;

    if (path) {
      console.log('[selectICCProfilePath] Profil ausgewählt:', path);
      // Pfad in localStorage speichern - KEINE Datei kopieren!
      localStorage.setItem(ICC_PROFILE_PATH_KEY, path);
      return path;
    } else {
      console.log('[selectICCProfilePath] Keine Auswahl');
      return null;
    }
  } catch (error) {
    console.error('[selectICCProfilePath] ERROR:', error);
    throw error;
  }
}

/**
 * Gibt den gespeicherten ICC-Profil-Pfad zurück
 *
 * @returns string | null - Gespeicherter Pfad oder null
 *
 * @example
 * const path = getICCProfilePath();
 * if (path) {
 *   await convertPDFToCMYK(inputPath, outputPath, path);
 * }
 */
export function getICCProfilePath(): string | null {
  const path = localStorage.getItem(ICC_PROFILE_PATH_KEY);
  if (path) {
    console.log('[getICCProfilePath] Gespeicherter Pfad:', path);
  }
  return path;
}

/**
 * Löscht den gespeicherten ICC-Profil-Pfad
 *
 * @example
 * clearICCProfilePath();
 */
export function clearICCProfilePath(): void {
  console.log('[clearICCProfilePath] Lösche gespeicherten Pfad');
  localStorage.removeItem(ICC_PROFILE_PATH_KEY);
}

/**
 * Prüft ob ein ICC-Profil-Pfad gespeichert ist
 *
 * @returns boolean - true wenn Pfad gespeichert ist
 *
 * @example
 * if (hasICCProfilePath()) {
 *   console.log('ICC-Profil konfiguriert:', getICCProfilePath());
 * }
 */
export function hasICCProfilePath(): boolean {
  return getICCProfilePath() !== null;
}

/**
 * Extrahiert Dateinamen aus Pfad für Anzeige
 *
 * @param path - Vollständiger Pfad
 * @returns string - Nur der Dateiname
 *
 * @example
 * getICCProfileFileName('/Users/name/profiles/CoatedFOGRA39.icc')
 * // => 'CoatedFOGRA39.icc'
 */
export function getICCProfileFileName(path: string): string {
  // Unterstützt Windows (\) und Unix (/)
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
