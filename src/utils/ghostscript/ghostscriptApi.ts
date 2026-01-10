/**
 * Ghostscript API Integration
 *
 * TypeScript wrapper for Tauri commands that interact with the embedded
 * Ghostscript binary for PDF color space conversion.
 */

import { invoke } from '@tauri-apps/api/tauri';

/**
 * Options for CMYK conversion
 */
export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  iccProfileName?: string;
  preserveSpotColors: boolean;
  renderIntent: RenderIntent;
}

/**
 * Result of PDF conversion
 */
export interface ConversionResult {
  success: boolean;
  outputPath: string;
  message: string;
  error?: string;
}

/**
 * ICC Rendering Intent
 *
 * - Perceptual (0): Best for photographs, compresses gamut
 * - RelativeColorimetric (1): Standard for print, preserves in-gamut colors
 * - Saturation (2): Best for business graphics, vivid colors
 * - AbsoluteColorimetric (3): Proofing, simulates paper white
 */
export enum RenderIntent {
  Perceptual = 0,
  RelativeColorimetric = 1,
  Saturation = 2,
  AbsoluteColorimetric = 3,
}

/**
 * ICC Profile information
 */
export interface ICCProfileInfo {
  filename: string;
  size: number;
  colorSpace: string;
  pcs: string; // Profile Connection Space
  version: string;
}

/**
 * Converts a PDF to CMYK color space using Ghostscript
 *
 * @param options Conversion options
 * @returns Conversion result with success status
 *
 * @example
 * ```ts
 * const result = await convertToCMYK({
 *   inputPath: '/path/to/input.pdf',
 *   outputPath: '/path/to/output.pdf',
 *   iccProfileName: 'ISOcoated_v2_eci.icc',
 *   preserveSpotColors: true,
 *   renderIntent: RenderIntent.RelativeColorimetric
 * });
 *
 * if (result.success) {
 *   console.log('Conversion successful!');
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 */
export async function convertToCMYK(
  options: ConversionOptions
): Promise<ConversionResult> {
  try {
    const result = await invoke<ConversionResult>('convert_to_cmyk', {
      options: {
        input_path: options.inputPath,
        output_path: options.outputPath,
        icc_profile_name: options.iccProfileName,
        preserve_spot_colors: options.preserveSpotColors,
        render_intent: options.renderIntent,
      },
    });
    return result;
  } catch (error) {
    return {
      success: false,
      outputPath: options.outputPath,
      message: 'Failed to invoke Ghostscript conversion',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Lists all available ICC profiles from bundled resources
 *
 * @returns Array of ICC profile filenames
 *
 * @example
 * ```ts
 * const profiles = await listICCProfiles();
 * console.log('Available profiles:', profiles);
 * // Output: ['ISOcoated_v2_eci.icc', 'sRGB.icc', ...]
 * ```
 */
export async function listICCProfiles(): Promise<string[]> {
  try {
    return await invoke<string[]>('list_icc_profiles');
  } catch (error) {
    console.error('Failed to list ICC profiles:', error);
    return [];
  }
}

/**
 * Checks if a PDF contains spot colors (like CutContour)
 *
 * @param pdfPath Path to PDF file
 * @returns Array of spot color names found in the PDF
 *
 * @example
 * ```ts
 * const spotColors = await checkSpotColors('/path/to/document.pdf');
 * if (spotColors.includes('CutContour')) {
 *   console.log('PDF already has CutContour layer');
 * }
 * ```
 */
export async function checkSpotColors(pdfPath: string): Promise<string[]> {
  try {
    return await invoke<string[]>('check_spot_colors', { pdfPath });
  } catch (error) {
    console.error('Failed to check spot colors:', error);
    return [];
  }
}

/**
 * Gets metadata information about an ICC profile
 *
 * @param profileName Name of the ICC profile file
 * @returns ICC profile metadata
 *
 * @example
 * ```ts
 * const info = await getICCProfileInfo('ISOcoated_v2_eci.icc');
 * console.log(`Profile: ${info.filename}`);
 * console.log(`Color Space: ${info.colorSpace}`);
 * console.log(`Version: ${info.version}`);
 * ```
 */
export async function getICCProfileInfo(
  profileName: string
): Promise<ICCProfileInfo | null> {
  try {
    return await invoke<ICCProfileInfo>('get_icc_profile_info', {
      profileName,
    });
  } catch (error) {
    console.error('Failed to get ICC profile info:', error);
    return null;
  }
}

/**
 * Converts a PDF with full workflow:
 * 1. Checks for existing spot colors
 * 2. Converts to CMYK with specified ICC profile
 * 3. Preserves spot colors if requested
 *
 * @param inputPath Path to input PDF
 * @param outputPath Path to output PDF
 * @param iccProfile ICC profile to use (optional)
 * @param preserveSpotColors Whether to preserve spot colors like CutContour
 * @returns Conversion result
 */
export async function convertPDFWorkflow(
  inputPath: string,
  outputPath: string,
  iccProfile?: string,
  preserveSpotColors: boolean = true
): Promise<ConversionResult> {
  // Check for existing spot colors
  const spotColors = await checkSpotColors(inputPath);
  console.log('Found spot colors:', spotColors);

  // Perform conversion
  const result = await convertToCMYK({
    inputPath,
    outputPath,
    iccProfileName: iccProfile,
    preserveSpotColors,
    renderIntent: RenderIntent.RelativeColorimetric,
  });

  return result;
}

/**
 * Default ICC profiles for common use cases
 */
export const DEFAULT_ICC_PROFILES = {
  PRINT_EUROPE: 'ISOcoated_v2_eci.icc', // Fogra39
  PRINT_US: 'USWebCoatedSWOP.icc',
  PRINT_MODERN: 'PSO_Coated_v3.icc', // Fogra51
  RGB_STANDARD: 'sRGB.icc',
  RGB_WIDE_GAMUT: 'AdobeRGB1998.icc',
} as const;
