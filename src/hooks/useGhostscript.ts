/**
 * React Hook for Ghostscript Integration
 *
 * Provides easy access to Ghostscript CMYK conversion functionality
 * with React state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  convertToCMYK,
  listICCProfiles,
  checkSpotColors,
  getICCProfileInfo,
  ConversionOptions,
  ConversionResult,
  RenderIntent,
  ICCProfileInfo,
} from '../utils/ghostscript/ghostscriptApi';

/**
 * Hook return type
 */
interface UseGhostscriptReturn {
  // State
  availableProfiles: string[];
  isLoading: boolean;
  error: string | null;
  conversionResult: ConversionResult | null;

  // Actions
  convert: (options: ConversionOptions) => Promise<ConversionResult>;
  refreshProfiles: () => Promise<void>;
  checkPDFSpotColors: (pdfPath: string) => Promise<string[]>;
  getProfileInfo: (profileName: string) => Promise<ICCProfileInfo | null>;
  clearError: () => void;
  clearResult: () => void;
}

/**
 * Custom hook for Ghostscript PDF conversion
 *
 * @example
 * ```tsx
 * function PDFConverter() {
 *   const {
 *     availableProfiles,
 *     convert,
 *     isLoading,
 *     conversionResult,
 *     error
 *   } = useGhostscript();
 *
 *   const handleConvert = async () => {
 *     const result = await convert({
 *       inputPath: '/path/to/input.pdf',
 *       outputPath: '/path/to/output.pdf',
 *       iccProfileName: availableProfiles[0],
 *       preserveSpotColors: true,
 *       renderIntent: RenderIntent.RelativeColorimetric
 *     });
 *
 *     if (result.success) {
 *       alert('Conversion successful!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <select>
 *         {availableProfiles.map(profile => (
 *           <option key={profile} value={profile}>{profile}</option>
 *         ))}
 *       </select>
 *       <button onClick={handleConvert} disabled={isLoading}>
 *         Convert to CMYK
 *       </button>
 *       {error && <div className="error">{error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGhostscript(): UseGhostscriptReturn {
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);

  /**
   * Loads available ICC profiles on mount
   */
  const refreshProfiles = useCallback(async () => {
    try {
      const profiles = await listICCProfiles();
      setAvailableProfiles(profiles);
    } catch (err) {
      console.error('Failed to load ICC profiles:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load ICC profiles'
      );
    }
  }, []);

  /**
   * Converts PDF to CMYK
   */
  const convert = useCallback(
    async (options: ConversionOptions): Promise<ConversionResult> => {
      setIsLoading(true);
      setError(null);
      setConversionResult(null);

      try {
        const result = await convertToCMYK(options);
        setConversionResult(result);

        if (!result.success) {
          setError(result.error || 'Conversion failed');
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Conversion failed';
        setError(errorMessage);

        const failedResult: ConversionResult = {
          success: false,
          outputPath: options.outputPath,
          message: 'Conversion failed',
          error: errorMessage,
        };
        setConversionResult(failedResult);

        return failedResult;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Checks if PDF contains spot colors
   */
  const checkPDFSpotColors = useCallback(
    async (pdfPath: string): Promise<string[]> => {
      try {
        return await checkSpotColors(pdfPath);
      } catch (err) {
        console.error('Failed to check spot colors:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to check spot colors'
        );
        return [];
      }
    },
    []
  );

  /**
   * Gets ICC profile metadata
   */
  const getProfileInfo = useCallback(
    async (profileName: string): Promise<ICCProfileInfo | null> => {
      try {
        return await getICCProfileInfo(profileName);
      } catch (err) {
        console.error('Failed to get profile info:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to get profile info'
        );
        return null;
      }
    },
    []
  );

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears conversion result
   */
  const clearResult = useCallback(() => {
    setConversionResult(null);
  }, []);

  // Load profiles on mount
  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  return {
    availableProfiles,
    isLoading,
    error,
    conversionResult,
    convert,
    refreshProfiles,
    checkPDFSpotColors,
    getProfileInfo,
    clearError,
    clearResult,
  };
}

/**
 * Hook options with default values
 */
interface UseGhostscriptConversionOptions {
  preserveSpotColors?: boolean;
  renderIntent?: RenderIntent;
  defaultProfile?: string;
}

/**
 * Simplified hook for quick CMYK conversion
 *
 * @param options Default conversion options
 *
 * @example
 * ```tsx
 * function QuickConverter() {
 *   const { convertQuick, isLoading, result } = useQuickConversion({
 *     preserveSpotColors: true,
 *     defaultProfile: 'ISOcoated_v2_eci.icc'
 *   });
 *
 *   const handleConvert = async (inputPath: string, outputPath: string) => {
 *     await convertQuick(inputPath, outputPath);
 *   };
 *
 *   return (
 *     <button onClick={() => handleConvert('in.pdf', 'out.pdf')} disabled={isLoading}>
 *       Convert to CMYK
 *     </button>
 *   );
 * }
 * ```
 */
export function useQuickConversion(
  options: UseGhostscriptConversionOptions = {}
) {
  const ghostscript = useGhostscript();

  const convertQuick = useCallback(
    async (inputPath: string, outputPath: string) => {
      return ghostscript.convert({
        inputPath,
        outputPath,
        iccProfileName: options.defaultProfile,
        preserveSpotColors: options.preserveSpotColors ?? true,
        renderIntent: options.renderIntent ?? RenderIntent.RelativeColorimetric,
      });
    },
    [ghostscript, options]
  );

  return {
    convertQuick,
    isLoading: ghostscript.isLoading,
    error: ghostscript.error,
    result: ghostscript.conversionResult,
    clearError: ghostscript.clearError,
    clearResult: ghostscript.clearResult,
  };
}
