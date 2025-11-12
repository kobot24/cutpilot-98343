/**
 * Color Conversion Utilities
 *
 * Provides pixel-level color space transformations for true color conversion.
 * Supports RGB → CMYK, RGB → Grayscale conversions with optional ICC profile application.
 */

export interface CMYKColor {
  c: number; // Cyan (0-100)
  m: number; // Magenta (0-100)
  y: number; // Yellow (0-100)
  k: number; // Black (0-100)
}

export interface RGBColor {
  r: number; // Red (0-255)
  g: number; // Green (0-255)
  b: number; // Blue (0-255)
}

/**
 * Convert RGB to CMYK using standard formula
 * This is an approximation - true conversion requires ICC profiles
 */
export const rgbToCmyk = (r: number, g: number, b: number): CMYKColor => {
  // Normalize RGB values to 0-1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Calculate K (black)
  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Avoid division by zero
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  // Calculate CMY
  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
};

/**
 * Convert RGB to Grayscale using luminance formula
 * Uses ITU-R BT.709 standard: Y = 0.2126*R + 0.7152*G + 0.0722*B
 */
export const rgbToGrayscale = (r: number, g: number, b: number): number => {
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
};

/**
 * Convert CMYK back to RGB (for preview purposes)
 */
export const cmykToRgb = (c: number, m: number, y: number, k: number): RGBColor => {
  // Normalize CMYK values to 0-1
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
};

/**
 * Transform an image to CMYK color space
 * Returns a new image data URL with CMYK pixel data encoded as RGB channels
 */
export const transformImageToCMYK = async (
  img: HTMLImageElement
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Transform each pixel from RGB to CMYK
      // Note: We'll store CMYK as RGB channels for now since canvas only supports RGB
      // The actual CMYK data will be used in PDF generation
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Convert to CMYK
        const cmyk = rgbToCmyk(r, g, b);

        // Convert back to RGB for canvas display (approximation)
        const rgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);

        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        data[i + 3] = a; // Keep alpha unchanged
      }

      // Put transformed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      resolve({
        dataUrl,
        width: canvas.width,
        height: canvas.height
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Transform an image to Grayscale
 * Returns a new image data URL with grayscale pixel data
 */
export const transformImageToGrayscale = async (
  img: HTMLImageElement
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Transform each pixel to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale
        const gray = rgbToGrayscale(r, g, b);

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // Alpha channel (i+3) remains unchanged
      }

      // Put transformed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      resolve({
        dataUrl,
        width: canvas.width,
        height: canvas.height
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get CMYK pixel data from an image
 * Returns a typed array with CMYK values (4 values per pixel: C, M, Y, K)
 */
export const getImageCMYKData = async (
  img: HTMLImageElement
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get RGB pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const rgbData = imageData.data;

      // Create CMYK data array (4 channels per pixel)
      const cmykData = new Uint8ClampedArray((canvas.width * canvas.height * 4));

      // Transform each pixel from RGB to CMYK
      for (let i = 0, j = 0; i < rgbData.length; i += 4, j += 4) {
        const r = rgbData[i];
        const g = rgbData[i + 1];
        const b = rgbData[i + 2];

        const cmyk = rgbToCmyk(r, g, b);

        // Store as 0-255 range (converting from 0-100 percentage)
        cmykData[j] = Math.round((cmyk.c / 100) * 255);     // C
        cmykData[j + 1] = Math.round((cmyk.m / 100) * 255); // M
        cmykData[j + 2] = Math.round((cmyk.y / 100) * 255); // Y
        cmykData[j + 3] = Math.round((cmyk.k / 100) * 255); // K
      }

      resolve({
        data: cmykData,
        width: canvas.width,
        height: canvas.height
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get Grayscale pixel data from an image
 * Returns a typed array with grayscale values (1 value per pixel)
 */
export const getImageGrayscaleData = async (
  img: HTMLImageElement
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get RGB pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const rgbData = imageData.data;

      // Create grayscale data array (1 channel per pixel)
      const grayData = new Uint8ClampedArray(canvas.width * canvas.height);

      // Transform each pixel to grayscale
      for (let i = 0, j = 0; i < rgbData.length; i += 4, j++) {
        const r = rgbData[i];
        const g = rgbData[i + 1];
        const b = rgbData[i + 2];

        grayData[j] = rgbToGrayscale(r, g, b);
      }

      resolve({
        data: grayData,
        width: canvas.width,
        height: canvas.height
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Determine if an image should be converted based on settings
 */
export const shouldConvertImage = (
  sourceColorSpace: 'DeviceRGB' | 'DeviceCMYK' | 'DeviceGray',
  targetColorSpace: 'DeviceRGB' | 'DeviceCMYK' | 'DeviceGray',
  convertColorSpace: boolean
): boolean => {
  // Don't convert if conversion is disabled
  if (!convertColorSpace) return false;

  // Don't convert if already in target color space
  if (sourceColorSpace === targetColorSpace) return false;

  return true;
};
