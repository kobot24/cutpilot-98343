import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { fetchPDFDataFromUrl } from '@/utils/print-plate/pdfDataUtils';

/**
 * Hook for PDF item manipulation operations
 */
export const usePDFItemOperations = (
  items: PDFItemType[],
  setItems: React.Dispatch<React.SetStateAction<PDFItemType[]>>,
  plateSize: PrintPlateSize
) => {
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

  // Improved rotate item function with better position handling
  const handleRotateItem = (index: number) => {
    const item = { ...items[index] };
    
    // Get the current center point before rotation
    const centerX = item.x + (item.width / 2);
    const centerY = item.y + (item.height / 2);
    
    // Rotate by 90 degrees clockwise each time
    const oldRotation = item.rotation;
    item.rotation = (item.rotation + 90) % 360;
    
    // For 90° and 270° rotations, we need to ensure position is correct
    // for both the UI representation and the PDF export
    
    // If we're rotating to 90° or 270° from 0° or 180°
    if ((item.rotation === 90 || item.rotation === 270) && 
        (oldRotation === 0 || oldRotation === 180)) {
      // Calculate new position to keep the center point the same
      item.x = centerX - (item.height / 2);
      item.y = centerY - (item.width / 2);
      
      console.log(`Rotated to ${item.rotation}°. Center: ${centerX}, ${centerY}. New position: ${item.x}, ${item.y}`);
    } 
    // If we're rotating back to 0° or 180° from 90° or 270°
    else if ((item.rotation === 0 || item.rotation === 180) && 
             (oldRotation === 90 || oldRotation === 270)) {
      // Readjust position when returning to original orientation
      item.x = centerX - (item.width / 2);
      item.y = centerY - (item.height / 2);
      
      console.log(`Rotated to ${item.rotation}°. Center: ${centerX}, ${centerY}. New position: ${item.x}, ${item.y}`);
    }
    
    // Ensure we have PDF data for rotated items (critical for export)
    // Always fetch or ensure PDF data is available for better export reliability
    if (item.pdfUrl) {
      console.log(`Prefetching PDF data for rotated item ${item.id} (rotation: ${item.rotation}°)`);
      
      // Try to fetch PDF data immediately to ensure it's available for export
      fetchPDFDataFromUrl(item.pdfUrl)
        .then(pdfData => {
          console.log(`PDF data fetched for rotated item ${item.id}: ${pdfData.byteLength} bytes`);
          
          // Update the item with fetched PDF data
          setItems(prevItems => {
            const updatedItems = [...prevItems];
            const itemIndex = updatedItems.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                pdfData
              };
            }
            return updatedItems;
          });
        })
        .catch(error => {
          console.error(`Failed to fetch PDF data for rotated item ${item.id}:`, error);
        });
    }
    
    // Update the items array with the rotated item
    const updatedItems = [...items];
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
  
  // Clear all items from the plate
  const handleClearPlate = () => {
    setItems([]);
    toast.info("Druckplatte geleert");
  };

  return {
    handleFitToPlate,
    handleRotateItem,
    handleRemoveItem,
    handleClearPlate
  };
};
