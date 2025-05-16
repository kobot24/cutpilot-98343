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
      
      // Create a new PDF item with dimensions in cm
      const newItem: PDFItemType = {
        id: file.id,
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

  // Rotate item and ensure PDF data is preserved
  const handleRotateItem = (index: number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    
    // Rotate by 90 degrees clockwise each time
    item.rotation = (item.rotation + 90) % 360;
    
    // For 90° and 270° rotations, we need to adjust position to keep it centered
    if ((item.rotation === 90 || item.rotation === 270) && 
        (updatedItems[index].rotation === 0 || updatedItems[index].rotation === 180)) {
      // Calculate the center point before rotation
      const centerX = item.x + (item.width / 2);
      const centerY = item.y + (item.height / 2);
      
      // For 90° and 270° we need to swap width and height for proper positioning
      const tempWidth = item.width;
      
      // Adjust position to keep the center point the same after rotation
      item.x = centerX - (item.height / 2);
      item.y = centerY - (tempWidth / 2);
    } 
    // For 0° and 180° rotations after being at 90° or 270°
    else if ((item.rotation === 0 || item.rotation === 180) && 
             (updatedItems[index].rotation === 90 || updatedItems[index].rotation === 270)) {
      // Calculate the center point before rotation
      const centerX = item.x + (item.width / 2);
      const centerY = item.y + (item.height / 2);
      
      // Re-adjust position to account for swapping back
      item.x = centerX - (item.width / 2);
      item.y = centerY - (item.height / 2);
    }
    
    updatedItems[index] = item;
    setItems(updatedItems);
    
    toast.info(`Element um 90° gedreht (${item.rotation}°)`);
    console.log(`Rotated item to ${item.rotation}°, position: x=${item.x}, y=${item.y}, width=${item.width}, height=${item.height}`);
  };
  
  // Remove item
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    toast.info("Element von der Druckplatte entfernt");
  };

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate,
    handleRotateItem,
    handleRemoveItem
  };
};
