/**
 * Color Space Utilities
 * Functions for detecting and converting color spaces in images and PDFs
 */

/**
 * Detect the color space of an image
 * For JPG/PNG images, we analyze the image data to determine the color space
 */
export const detectImageColorSpace = async (
  img: HTMLImageElement
): Promise<'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray'> => {
  try {
    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      console.warn('Could not get canvas context for color space detection, defaulting to RGB');
      return 'DeviceRGB';
    }

    // Use a small sample of the image for performance
    const sampleSize = Math.min(100, img.naturalWidth);
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    let isGrayscale = true;

    // Sample pixels to check if the image is grayscale
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If R, G, and B are not equal, it's not grayscale
      if (r !== g || g !== b) {
        isGrayscale = false;
        break;
      }
    }

    if (isGrayscale) {
      console.log('Detected color space: DeviceGray');
      return 'DeviceGray';
    }

    // For web images, the default is RGB
    // CMYK detection would require reading EXIF or embedded ICC profiles from the original file
    // which is complex and not reliable for web-uploaded images
    console.log('Detected color space: DeviceRGB');
    return 'DeviceRGB';
  } catch (error) {
    console.error('Error detecting color space:', error);
    return 'DeviceRGB'; // Default fallback
  }
};

/**
 * Convert image color space
 * This function prepares image data for a specific color space
 * Note: True CMYK conversion requires ICC profiles and is done during PDF embedding
 */
export const convertImageColorSpace = async (
  imageData: ArrayBuffer,
  sourceColorSpace: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray',
  targetColorSpace: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray',
  iccProfileData?: string // Base64 encoded ICC profile
): Promise<ArrayBuffer> => {
  // If source and target are the same, no conversion needed
  if (sourceColorSpace === targetColorSpace) {
    console.log(`No color space conversion needed (already ${targetColorSpace})`);
    return imageData;
  }

  console.log(`Color space conversion requested: ${sourceColorSpace} → ${targetColorSpace}`);

  // For now, we'll return the original data
  // The actual color space conversion will be handled by:
  // 1. The ICC profile embedding in the PDF (for CMYK)
  // 2. The PDF library's color space handling
  //
  // True color space conversion would require:
  // - For RGB → CMYK: Complex ICC profile-based conversion
  // - For CMYK → RGB: Inverse ICC profile conversion
  // - For Grayscale: Channel reduction/expansion
  //
  // Since we're working with JPG images that are already in a specific color space,
  // and pdf-lib handles the color space declaration in the PDF,
  // we rely on the ICC profile embedding to ensure correct interpretation

  console.log('Color space will be declared in PDF metadata and ICC profile will be embedded');
  return imageData;
};

/**
 * Get color space name for PDF metadata
 */
export const getColorSpaceName = (
  colorSpace: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray'
): string => {
  switch (colorSpace) {
    case 'DeviceCMYK':
      return 'DeviceCMYK';
    case 'DeviceRGB':
      return 'DeviceRGB';
    case 'DeviceGray':
      return 'DeviceGray';
    default:
      return 'DeviceRGB';
  }
};
