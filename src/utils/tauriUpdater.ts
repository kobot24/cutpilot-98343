/**
 * Tauri Updater Utilities
 * Handles automatic updates for the desktop application
 */

import { isTauri } from './tauri';

export type UpdateStatus =
  | { type: 'IDLE' }
  | { type: 'CHECKING' }
  | { type: 'UPDATE_AVAILABLE'; version: string; date: string; body: string }
  | { type: 'UP_TO_DATE' }
  | { type: 'DOWNLOADING'; progress: number }
  | { type: 'DOWNLOADED' }
  | { type: 'INSTALLING' }
  | { type: 'ERROR'; message: string };

/**
 * Check for available updates
 */
export const checkForUpdate = async (): Promise<UpdateStatus> => {
  if (!isTauri()) {
    return { type: 'ERROR', message: 'Updater ist nur in der Desktop-Version verfügbar' };
  }

  try {
    const { checkUpdate, onUpdaterEvent } = await import('@tauri-apps/api/updater');

    console.log('Checking for updates...');

    return new Promise((resolve) => {
      // Listen for update events
      const unlisten = onUpdaterEvent((event) => {
        console.log('Updater event:', event);

        switch (event.status) {
          case 'PENDING':
            // Update is available but not downloaded yet
            if (event.version && event.date && event.body) {
              resolve({
                type: 'UPDATE_AVAILABLE',
                version: event.version,
                date: event.date,
                body: event.body
              });
            }
            break;
          case 'DONE':
            // Already up to date or update completed
            resolve({ type: 'UP_TO_DATE' });
            break;
          case 'ERROR':
            resolve({
              type: 'ERROR',
              message: event.error || 'Fehler beim Prüfen auf Updates'
            });
            break;
        }
      });

      // Start the update check
      checkUpdate().catch((error) => {
        console.error('Error checking for updates:', error);
        resolve({
          type: 'ERROR',
          message: error?.message || 'Fehler beim Prüfen auf Updates'
        });
      });
    });
  } catch (error) {
    console.error('Error importing updater:', error);
    return {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Fehler beim Laden des Updaters'
    };
  }
};

/**
 * Install a downloaded update
 */
export const installUpdate = async (): Promise<void> => {
  if (!isTauri()) {
    throw new Error('Updater ist nur in der Desktop-Version verfügbar');
  }

  try {
    const { installUpdate: tauriInstallUpdate } = await import('@tauri-apps/api/updater');

    console.log('Installing update...');
    await tauriInstallUpdate();

    // After install, the app will restart automatically
  } catch (error) {
    console.error('Error installing update:', error);
    throw error;
  }
};

/**
 * Get current application version
 */
export const getCurrentVersion = async (): Promise<string> => {
  if (!isTauri()) {
    return '1.0.0 (Browser)';
  }

  try {
    const { getVersion } = await import('@tauri-apps/api/app');
    return await getVersion();
  } catch (error) {
    console.error('Error getting version:', error);
    return '1.0.0';
  }
};
