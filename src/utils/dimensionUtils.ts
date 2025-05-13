
/**
 * Utilities for dimension conversions between different units
 */

// Constants for conversions
const POINTS_PER_INCH = 72; // PDF standard
const CM_PER_INCH = 2.54;
const MM_PER_INCH = 25.4;

/**
 * Convert centimeters to PDF points
 * @param cm Value in centimeters
 * @returns Value in points
 */
export const cmToPoints = (cm: number): number => {
  return (cm * POINTS_PER_INCH) / CM_PER_INCH;
};

/**
 * Convert millimeters to PDF points
 * @param mm Value in millimeters
 * @returns Value in points
 */
export const mmToPoints = (mm: number): number => {
  return (mm * POINTS_PER_INCH) / MM_PER_INCH;
};

/**
 * Convert PDF points to centimeters
 * @param points Value in PDF points
 * @returns Value in centimeters
 */
export const pointsToCm = (points: number): number => {
  return (points * CM_PER_INCH) / POINTS_PER_INCH;
};

/**
 * Calculate physical dimensions from pixel dimensions and DPI
 * @param pixelWidth Width in pixels
 * @param pixelHeight Height in pixels
 * @param dpi DPI value
 * @returns Object with width and height in different units
 */
export const calculateDimensions = (pixelWidth: number, pixelHeight: number, dpi: number) => {
  // Calculate physical dimensions in inches
  const widthInInches = pixelWidth / dpi;
  const heightInInches = pixelHeight / dpi;
  
  // Convert to various units
  return {
    inches: {
      width: widthInInches,
      height: heightInInches
    },
    points: {
      width: widthInInches * POINTS_PER_INCH,
      height: heightInInches * POINTS_PER_INCH
    },
    cm: {
      width: widthInInches * CM_PER_INCH,
      height: heightInInches * CM_PER_INCH
    }
  };
};
