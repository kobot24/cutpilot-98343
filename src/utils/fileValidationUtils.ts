
import { toast } from '@/components/ui/use-toast';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';

/**
 * Checks if an image is too large for PDF processing
 * Note: This only applies to images, not PDFs
 */
export const isImageTooLarge = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Skip check for PDF files (they don't need pixel dimension checks)
    if (url.includes('.pdf') || url.startsWith('data:application/pdf')) {
      resolve(false);
      return;
    }

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
    // Accept both images and PDFs
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Nicht unterstützt",
        description: `Datei "${file.name}" ist kein unterstütztes Format (nur Bilder und PDFs)`,
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
    img.crossOrigin = "anonymous"; // Wichtig für CORS-Probleme mit Blob-URLs
    img.src = imageUrl;
  });
  
  const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
  console.log(`Bild hat ${megapixels.toFixed(1)} Megapixel (${img.naturalWidth}x${img.naturalHeight}px)`);
  
  // Wenn das Bild nahe an unserem Limit ist, skalieren wir es herunter
  // Reduzieren wir den Schwellenwert auf 70%, um mehr Bilder zu optimieren
  if (megapixels > FILE_STORAGE_LIMITS.MAX_IMAGE_MEGAPIXELS * 0.7) {
    console.log(`Großes Bild erkannt (${megapixels.toFixed(1)}MP), wird optimiert...`);
    
    // Skalierungsfaktor berechnen, um es auf 70% der maximalen Größe zu bringen
    const targetMP = FILE_STORAGE_LIMITS.MAX_IMAGE_MEGAPIXELS * 0.7;
    const scaleFactor = Math.sqrt(targetMP / megapixels);
    
    const newWidth = Math.floor(img.naturalWidth * scaleFactor);
    const newHeight = Math.floor(img.naturalHeight * scaleFactor);
    
    console.log(`Skaliere Bild von ${img.naturalWidth}x${img.naturalHeight} auf ${newWidth}x${newHeight}`);
    
    // Canvas für skaliertes Bild erstellen
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Konnte keinen Canvas-Kontext für die Bildskalierung erhalten');
      return imageUrl; // Original zurückgeben, wenn Skalierung fehlschlägt
    }
    
    // In mehreren Schritten skalieren bei sehr großen Bildern für bessere Qualität
    if (megapixels > 30) {
      // Bei sehr großen Bildern in zwei Schritten skalieren für bessere Qualität
      const tempCanvas = document.createElement('canvas');
      const midWidth = Math.floor((img.naturalWidth + newWidth) / 2);
      const midHeight = Math.floor((img.naturalHeight + newHeight) / 2);
      tempCanvas.width = midWidth;
      tempCanvas.height = midHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Erste Skalierung auf mittlere Größe
        tempCtx.drawImage(img, 0, 0, midWidth, midHeight);
        // Zweite Skalierung auf Zielgröße
        ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
      } else {
        // Fallback bei Fehler: Direkt auf Zielgröße skalieren
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }
    } else {
      // Normaler Fall: Direkt auf Zielgröße skalieren
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
    }
    
    // Als Blob-URL erhalten
    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const scaledUrl = URL.createObjectURL(blob);
          console.log(`Bild erfolgreich optimiert: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(scaledUrl);
        } else {
          console.error('Blob-Konvertierung fehlgeschlagen');
          resolve(imageUrl); // Original zurückgeben, wenn Konvertierung fehlschlägt
        }
      }, 'image/jpeg', 0.85); // Etwas niedrigere Qualität für bessere Komprimierung
    });
  }
  
  // Original-URL zurückgeben, wenn keine Skalierung nötig ist
  return imageUrl;
};
