
import { useState, useCallback } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { prefetchPDFData } from '@/utils/print-plate/pdfDataUtils';

/**
 * Generate a truly unique ID for PDF items
 * Improved to guarantee uniqueness even when adding the same file multiple times
 */
const generateUniqueItemId = (fileId: string): string => {
  // Use timestamp with high precision plus random component to ensure uniqueness
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `pdf-${fileId}-${timestamp}-${randomPart}`;
};

/**
 * Hook for adding PDFs to the print plate with optimized performance
 */
export const usePDFAddition = (
  items: PDFItemType[],
  setItems: React.Dispatch<React.SetStateAction<PDFItemType[]>>,
  plateSize: PrintPlateSize
) => {
  // Keep track of loading items to prevent multiple adds of the same file
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleAddPDF = useCallback(async (file: UploadedFile) => {
    if (!file.convertedPdfUrl) {
      toast.error("Keine PDF-Datei verfügbar");
      return;
    }
    
    // Prevent duplicate loads of the same file simultaneously
    if (loadingItems.has(file.id)) {
      console.log(`Already loading ${file.id}, ignoring duplicate request`);
      return;
    }
    
    // Mark as loading
    setLoadingItems(prev => new Set(prev).add(file.id));
    
    try {
      toast.info(`Füge ${file.name} zur Druckplatte hinzu...`, {
        duration: 1500,
        id: `add-pdf-${file.id}`
      });
      
      // Prefetch the PDF data to ensure it's in cache when we need it
      try {
        await prefetchPDFData(file.convertedPdfUrl);
      } catch (prefetchError) {
        console.warn(`Warning: Failed to prefetch PDF data for ${file.id}:`, prefetchError);
        // Continue anyway as we'll retry during actual usage
      }
      
      // Create a temporary PDF loader to get dimensions
      const pdfLoader = new Promise<{ width: number, height: number, dpi: number }>((resolve) => {
        // Load the PDF to get its dimensions
        const img = new Image();
        img.onload = async () => {
          // Default DPI - can be overridden if we detect actual DPI
          let dpi = 100;
          
          // Calculate physical dimensions in cm based on DPI
          const widthCm = (img.width / dpi) * 2.54;
          const heightCm = (img.height / dpi) * 2.54;
          
          resolve({
            width: widthCm,
            height: heightCm,
            dpi: dpi
          });
        };
        
        img.onerror = async () => {
          // Use default dimensions
          resolve({
            width: 20,
            height: 15,
            dpi: 72
          });
        };
        
        // Use the file.url instead of pdfUrl 
        img.src = file.url;
      });
      
      const { width, height, dpi } = await pdfLoader;
      
      // Position the item in the center of the plate
      const centerX = Math.max(0, (plateSize.width - width) / 2);
      const centerY = Math.max(0, (plateSize.height - height) / 2);
      
      // Generate a unique ID for this specific item placement
      const uniqueItemId = generateUniqueItemId(file.id);
      
      // Create a new PDF item with dimensions in cm
      const newItem: PDFItemType = {
        id: uniqueItemId,
        fileId: file.id, // Store original file ID for reference
        pdfUrl: file.convertedPdfUrl,
        x: centerX, // Center position in cm
        y: centerY, // Center position in cm
        width, // Width in cm
        height, // Height in cm
        rotation: 0,
        aspectRatio: height / width,
        thumbnail: file.url, // Use original image as thumbnail for faster loading
        dpi: dpi,
      };
      
      console.log(`PDF Addition - Adding new item with ID: ${uniqueItemId}, file ID: ${file.id}, URL: ${file.convertedPdfUrl.substring(0, 20)}...`);
      
      // Add the new item to the items array
      setItems(prevItems => [...prevItems, newItem]);
      
      toast.success(`${file.name} zur Druckplatte hinzugefügt`, {
        id: `add-pdf-${file.id}`
      });
      toast.info(`Größe: ${width.toFixed(1)} × ${height.toFixed(1)} cm bei ${dpi} DPI`, {
        duration: 3000
      });
    } catch (error) {
      console.error("Error adding PDF to plate:", error);
      toast.error(`Fehler beim Hinzufügen von ${file.name}`);
    } finally {
      // Remove from loading set
      setLoadingItems(prev => {
        const updated = new Set(prev);
        updated.delete(file.id);
        return updated;
      });
    }
  }, [plateSize, setItems, loadingItems]);

  return {
    handleAddPDF
  };
};
