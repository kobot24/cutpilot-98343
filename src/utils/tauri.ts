/**
 * Tauri Platform Detection and Helper Functions
 */

// Check if running in Tauri context
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Get platform name
export const getPlatform = (): string => {
  if (!isTauri()) return 'web';

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';
  return 'unknown';
};

// Check if running on desktop (Mac or Windows)
export const isDesktop = (): boolean => {
  const platform = getPlatform();
  return platform === 'macos' || platform === 'windows';
};

// Export platform info for debugging
export const getPlatformInfo = () => {
  return {
    isTauri: isTauri(),
    platform: getPlatform(),
    isDesktop: isDesktop(),
    userAgent: navigator.userAgent
  };
};
