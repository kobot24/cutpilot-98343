/**
 * CMYK Converter Frontend Utilities
 *
 * Provides frontend interface to Tauri backend CMYK conversion using Ghostscript.
 * This module enables TRUE CMYK conversion with ICC profile support.
 */

import { invoke } from '@tauri-apps/api/tauri';
import { isTauri } from './tauri';

export interface CMYKConversionResult {
  success: boolean;
  output_path: string;
  message: string;
}

/**
 * Convert PDF to CMYK using Ghostscript backend
 *
 * @param inputPdfPath - Path to input RGB PDF file
 * @param outputPdfPath - Path where CMYK PDF should be saved
 * @param iccProfilePath - Optional path to ICC profile
 * @returns Promise<CMYKConversionResult> with conversion status and output path
 *
 * @example
 * const result = await convertPDFToCMYK(
 *   '/tmp/input_rgb.pdf',
 *   '/tmp/output_cmyk.pdf',
 *   '/path/to/CoatedFOGRA39.icc'
 * );
 */
export async function convertPDFToCMYK(
  inputPdfPath: string,
  outputPdfPath: string,
  iccProfilePath?: string
): Promise<CMYKConversionResult> {
  if (!isTauri()) {
    throw new Error('CMYK conversion is only available in the desktop app (Tauri)');
  }

  try {
    console.log('[convertPDFToCMYK] Starting CMYK conversion...');
    console.log('[convertPDFToCMYK] Input:', inputPdfPath);
    console.log('[convertPDFToCMYK] Output:', outputPdfPath);
    console.log('[convertPDFToCMYK] ICC Profile:', iccProfilePath || 'None');

    const result = await invoke<CMYKConversionResult>('convert_pdf_to_cmyk', {
      inputPdf: inputPdfPath,
      outputPdf: outputPdfPath,
      iccProfile: iccProfilePath || null,
    });

    console.log('[convertPDFToCMYK] SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('[convertPDFToCMYK] ERROR:', error);
    throw error;
  }
}

/**
 * Check if Ghostscript is available on the system
 *
 * @returns Promise<boolean> true if Ghostscript is available
 *
 * @example
 * const available = await isGhostscriptAvailable();
 * if (!available) {
 *   alert('Please install Ghostscript for CMYK conversion');
 * }
 */
export async function isGhostscriptAvailable(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const available = await invoke<boolean>('check_ghostscript_available');
    console.log('[isGhostscriptAvailable] Ghostscript available:', available);
    return available;
  } catch (error) {
    console.error('[isGhostscriptAvailable] ERROR:', error);
    return false;
  }
}

/**
 * Get Ghostscript version string
 *
 * @returns Promise<string> Ghostscript version or error
 *
 * @example
 * const version = await getGhostscriptVersion();
 * console.log('Ghostscript version:', version); // "10.01.1"
 */
export async function getGhostscriptVersion(): Promise<string> {
  if (!isTauri()) {
    throw new Error('Ghostscript is only available in the desktop app');
  }

  try {
    const version = await invoke<string>('get_ghostscript_version');
    console.log('[getGhostscriptVersion] Version:', version);
    return version;
  } catch (error) {
    console.error('[getGhostscriptVersion] ERROR:', error);
    throw error;
  }
}

/**
 * Helper function to check if CMYK conversion is supported
 *
 * @returns Promise<{ supported: boolean; reason?: string }>
 */
export async function checkCMYKSupport(): Promise<{
  supported: boolean;
  reason?: string;
}> {
  if (!isTauri()) {
    return {
      supported: false,
      reason: 'CMYK conversion is only available in the desktop app',
    };
  }

  const gsAvailable = await isGhostscriptAvailable();
  if (!gsAvailable) {
    return {
      supported: false,
      reason: 'Ghostscript is not installed. Please install Ghostscript from https://ghostscript.com',
    };
  }

  try {
    const version = await getGhostscriptVersion();
    return {
      supported: true,
      reason: `Ghostscript ${version} is available`,
    };
  } catch {
    return {
      supported: false,
      reason: 'Ghostscript is installed but not working correctly',
    };
  }
}
