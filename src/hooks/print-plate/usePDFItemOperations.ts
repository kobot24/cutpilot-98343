
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';

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
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };
    
    // Get the current center point before rotation
    const centerX = item.x + (item.width / 2);
    const centerY = item.y + (item.height / 2);
    
    // Rotate by 90 degrees clockwise each time
    item.rotation = (item.rotation + 90) % 360;
    
    // For 90° and 270° rotations, we need to swap width and height for positioning
    if ((item.rotation === 90 || item.rotation === 270) && 
        (updatedItems[index].rotation === 0 || updatedItems[index].rotation === 180)) {
      // We need to maintain the same center point after rotation
      // but adjust for the new dimensions (width and height swap)
      item.x = centerX - (item.height / 2);
      item.y = centerY - (item.width / 2);
      
      console.log(`Rotated to ${item.rotation}°. Center: ${centerX}, ${centerY}. New position: ${item.x}, ${item.y}`);
    } 
    // For 0° and 180° rotations after being at 90° or 270°
    else if ((item.rotation === 0 || item.rotation === 180) && 
             (updatedItems[index].rotation === 90 || updatedItems[index].rotation === 270)) {
      // Readjust position when returning to original orientation
      item.x = centerX - (item.width / 2);
      item.y = centerY - (item.height / 2);
      
      console.log(`Rotated to ${item.rotation}°. Center: ${centerX}, ${centerY}. New position: ${item.x}, ${item.y}`);
    }
    
    // Ensure we have PDF data for rotated items (critical for export)
    if (!item.pdfData && item.pdfUrl) {
      console.log(`Item ${item.id} rotated to ${item.rotation}° but missing PDF data. Attempting to fetch...`);
      
      // Try to fetch PDF data immediately to ensure it's available for export
      fetch(item.pdfUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to fetch PDF data: ${response.status}`);
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          console.log(`PDF data fetched for rotated item ${item.id}`);
          const pdfData = new Uint8Array(arrayBuffer);
          
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
