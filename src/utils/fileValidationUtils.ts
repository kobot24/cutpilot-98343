
import { toast } from '@/components/ui/use-toast';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';

/**
 * Checks if an image is too large for PDF processing
 */
export const isImageTooLarge = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
      resolve(megapixels > FILE_STORAGE_LIMITS.MAX_IMAGE_MEGAPIXELS);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Checks if a file is considered "large" and needs special handling
 */
export const isLargeFile = (file: File): boolean => {
  return file.size > FILE_STORAGE_LIMITS.LARGE_FILE_THRESHOLD_BYTES;
};

/**
 * Validates files by type and size
 */
export const validateFiles = (files: File[]): File[] => {
  return files.filter(file => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Nicht unterstützt",
        description: `Datei "${file.name}" ist kein unterstütztes Bildformat`,
        variant: "destructive"
      });
      return false;
    }
    
    if (file.size > FILE_STORAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Datei zu groß",
        description: `Datei "${file.name}" überschreitet ${FILE_STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB Limit`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  });
};

/**
 * Optimizes an image for processing if needed
 * Returns original or scaled image as blob URL
 */
export const optimizeImageIfNeeded = async (imageUrl: string): Promise<string> => {
  // Check image dimensions
  const img = document.createElement('img');
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for optimization check'));
    img.src = imageUrl;
  });
  
  const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
  
  // If image is close to our limit, scale it down
  if (megapixels > FILE_STORAGE_LIMITS.MAX_IMAGE_MEGAPIXELS * 0.8) {
    console.log(`Large image detected (${megapixels.toFixed(1)}MP), optimizing...`);
    
    // Calculate scale factor to bring it down to target size (80% of max)
    const targetMP = FILE_STORAGE_LIMITS.MAX_IMAGE_MEGAPIXELS * 0.8;
    const scaleFactor = Math.sqrt(targetMP / megapixels);
    
    const newWidth = Math.floor(img.naturalWidth * scaleFactor);
    const newHeight = Math.floor(img.naturalHeight * scaleFactor);
    
    console.log(`Scaling image from ${img.naturalWidth}x${img.naturalHeight} to ${newWidth}x${newHeight}`);
    
    // Create canvas for scaled image
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context for image scaling');
      return imageUrl; // Return original if scaling fails
    }
    
    // Draw scaled image
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Get as blob URL
    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const scaledUrl = URL.createObjectURL(blob);
          resolve(scaledUrl);
        } else {
          resolve(imageUrl); // Return original if conversion fails
        }
      }, 'image/jpeg', 0.9);
    });
  }
  
  // Return original URL if no scaling needed
  return imageUrl;
};

