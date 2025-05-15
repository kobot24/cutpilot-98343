
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
