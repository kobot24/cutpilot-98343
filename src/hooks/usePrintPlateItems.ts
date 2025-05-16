
import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';

export const usePrintPlateItems = (plateSize: PrintPlateSize) => {
  const [items, setItems] = useState<PDFItemType[]>([]);
  
  const handleAddPDF = async (file: UploadedFile) => {
    if (!file.convertedPdfUrl) return;
    
    try {
      // Create a temporary PDF loader to get dimensions
      const pdfLoader = new Promise<{ width: number, height: number, dpi: number }>((resolve) => {
        // Load the PDF to get its dimensions
        const img = new Image();
        img.onload = () => {
          // Default DPI - can be overridden if we detect actual DPI
          let dpi = 100; // Assuming 100 DPI as mentioned by the user
          
          // Calculate physical dimensions in cm based on DPI
          // 1 inch = 2.54 cm, so divide pixel dimensions by DPI and multiply by 2.54
          const widthCm = (img.width / dpi) * 2.54;
          const heightCm = (img.height / dpi) * 2.54;
          
          resolve({
            width: widthCm,
            height: heightCm,
            dpi: dpi
          });
        };
        
        img.onerror = () => {
          // If we can't get dimensions, use defaults
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
      
      // Create a new PDF item with dimensions in cm
      const newItem: PDFItemType = {
        id: file.id,
        pdfUrl: file.convertedPdfUrl,
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
  
  // Function to fit item to plate size
  const handleFitToPlate = (index: number) => {
    if (!items[index]) return;
    
    const item = items[index];
    const itemAspectRatio = item.height / item.width;
    const plateAspectRatio = plateSize.height / plateSize.width;
    
    let newWidth, newHeight;
    
    if (itemAspectRatio > plateAspectRatio) {
      // Item is taller than plate (relative to width), so fit to height
      newHeight = plateSize.height * 0.9; // 90% of plate height
      newWidth = newHeight / itemAspectRatio;
    } else {
      // Item is wider than plate (relative to height), so fit to width
      newWidth = plateSize.width * 0.9; // 90% of plate width
      newHeight = newWidth * itemAspectRatio;
    }
    
    // Center the item
    const centerX = (plateSize.width - newWidth) / 2;
    const centerY = (plateSize.height - newHeight) / 2;
    
    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      width: newWidth,
      height: newHeight,
      x: centerX,
      y: centerY
    };
    
    setItems(updatedItems);
    toast.success("Druckdatei an die Plattengröße angepasst");
  };
  
  const handleClearPlate = () => {
    setItems([]);
    toast.info("Druckplatte geleert");
  };

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate
  };
};
