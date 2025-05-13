
/**
 * Utility functions for image handling and dimension calculations
 */

// Constants for DPI conversion
const POINTS_PER_INCH = 72; // PDF standard

/**
 * Detect DPI from image or use provided DPI
 * @param img Image element
 * @param providedDPI Optional DPI parameter that takes precedence if provided
 * @returns Detected or default DPI value
 */
export function detectImageDPI(img: HTMLImageElement, providedDPI?: number): number {
  // If DPI is explicitly provided, use it
  if (providedDPI && providedDPI > 0) {
    console.log(`Using provided DPI: ${providedDPI}`);
    return providedDPI;
  }
  
  // For now we're using a simple approach
  // In a real implementation, we could try to read EXIF data
  // or look for specific markers that might indicate the DPI
  
  // Default DPI for print quality
  const defaultDPI = 100;
  
  // Log what we're using
  console.log(`No DPI specified, using default DPI: ${defaultDPI}`);
  return defaultDPI;
}

/**
 * Convert a data URL or remote URL to an ArrayBuffer
 * @param imageUrl URL or data URL of the image
 * @returns Promise resolving to ArrayBuffer containing the image data
 */
export async function fetchImageData(imageUrl: string): Promise<ArrayBuffer> {
  try {
    console.log('Fetching image data');
    // For data URLs, we can directly use the image src without fetching
    if (imageUrl.startsWith('data:')) {
      // Extract base64 content from data URL
      const base64Content = imageUrl.split(',')[1];
      const imageData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0)).buffer;
      console.log('Using data URL directly');
      return imageData;
    } else {
      // For regular URLs, fetch the data
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      console.log('Image fetched from URL');
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error(`Fehler beim Laden des Bildes: ${error.message}`);
  }
}

/**
 * Load an image and get its dimensions
 * @param imageUrl URL of the image to load
 * @returns Promise resolving to the loaded image element
 */
export function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    
    // Set crossOrigin to anonymous to avoid CORS issues with data URLs
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
  });
}
