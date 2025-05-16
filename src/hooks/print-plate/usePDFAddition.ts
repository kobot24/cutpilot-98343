
import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { generateId } from '@/utils/fileUtils';

/**
 * Hook for adding PDFs to the print plate
 */
export const usePDFAddition = (
  items: PDFItemType[],
  setItems: React.Dispatch<React.SetStateAction<PDFItemType[]>>,
  plateSize: PrintPlateSize
) => {
  const handleAddPDF = async (file: UploadedFile) => {
    if (!file.convertedPdfUrl) return;
    
    try {
      // Create a temporary PDF loader to get dimensions
      const pdfLoader = new Promise<{ width: number, height: number, dpi: number, pdfData?: Uint8Array }>((resolve) => {
        // Load the PDF to get its dimensions
        const img = new Image();
        img.onload = async () => {
          // Default DPI - can be overridden if we detect actual DPI
          let dpi = 100; // Assuming 100 DPI as mentioned by the user
          
          // Calculate physical dimensions in cm based on DPI
          // 1 inch = 2.54 cm, so divide pixel dimensions by DPI and multiply by 2.54
          const widthCm = (img.width / dpi) * 2.54;
          const heightCm = (img.height / dpi) * 2.54;
          
          // Ensure PDF data is fetched and cached immediately
          let pdfData: Uint8Array | undefined = undefined;
          try {
            console.log(`Fetching and caching PDF data from: ${file.convertedPdfUrl.substring(0, 50)}...`);
            const response = await fetch(file.convertedPdfUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              pdfData = new Uint8Array(arrayBuffer);
              console.log(`PDF data cached successfully: ${pdfData.byteLength} bytes`);
            } else {
              console.error("Failed to fetch PDF data for caching:", response.status);
            }
          } catch (error) {
            console.error("Error caching PDF data:", error);
          }
          
          resolve({
            width: widthCm,
            height: heightCm,
            dpi: dpi,
            pdfData
          });
        };
        
        img.onerror = async () => {
          // If image fails to load, try to fetch the PDF directly to get its data
          try {
            console.log(`Image load failed, trying direct PDF fetch: ${file.convertedPdfUrl.substring(0, 50)}...`);
            const response = await fetch(file.convertedPdfUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const pdfData = new Uint8Array(arrayBuffer);
              console.log(`PDF data cached despite image load failure: ${pdfData.byteLength} bytes`);
              
              // Use default dimensions
              resolve({
                width: 20,
                height: 15,
                dpi: 72,
                pdfData
              });
            } else {
              // If fetch fails too, use defaults without PDF data
              console.error("Failed to fetch PDF after image load error:", response.status);
              resolve({
                width: 20,
                height: 15,
                dpi: 72
              });
            }
          } catch (error) {
            console.error("Error fetching PDF after image load error:", error);
            resolve({
              width: 20,
              height: 15,
              dpi: 72
            });
          }
        };
        
        // Use the file.url instead of pdfUrl 
        img.src = file.url;
      });
      
      const { width, height, dpi, pdfData } = await pdfLoader;
      
      // Position the item in the center of the plate
      const centerX = Math.max(0, (plateSize.width - width) / 2);
      const centerY = Math.max(0, (plateSize.height - height) / 2);
      
      // Generate a unique ID for this item that's different from file.id
      const uniqueItemId = `plate-${generateId()}`;
      
      // Create a new PDF item with dimensions in cm
      const newItem: PDFItemType = {
        id: uniqueItemId, // Use the uniquely generated ID to avoid duplicates
        pdfUrl: file.convertedPdfUrl,
        pdfData, // Store the PDF binary data with the item
        x: centerX, // Center position in cm
        y: centerY, // Center position in cm
        width, // Width in cm
        height, // Height in cm
        rotation: 0,
        aspectRatio: height / width,
        thumbnail: file.convertedPdfUrl,
        dpi: dpi,
      };
      
      setItems([...items, newItem]);
      toast.success(`${file.name} zur Druckplatte hinzugefügt`);
      toast.info(`Physische Größe: ${width.toFixed(1)} × ${height.toFixed(1)} cm bei ${dpi} DPI`);
    } catch (error) {
      console.error("Error adding PDF to plate:", error);
      toast.error("Fehler beim Hinzufügen der Datei");
    }
  };

  return {
    handleAddPDF
  };
};
