
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { fetchPDFDataFromUrl } from '@/utils/print-plate/pdfDataUtils';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';

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
    
    // Get effective dimensions based on rotation
    const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    const itemAspectRatio = effectiveDim.height / effectiveDim.width;
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
    
    // Apply dimensions according to rotation
    let updatedWidth = newWidth;
    let updatedHeight = newHeight;
    
    // If item is rotated 90° or 270°, we need to swap back the dimensions
    if (item.rotation === 90 || item.rotation === 270) {
      updatedWidth = newHeight;
      updatedHeight = newWidth;
    }
    
    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      width: updatedWidth,
      height: updatedHeight,
      x: centerX,
      y: centerY
    };
    
    setItems(updatedItems);
    toast.success("Druckdatei an die Plattengröße angepasst");
  };

  // Improved rotate item function with correct position handling
  const handleRotateItem = (index: number) => {
    const item = { ...items[index] };
    
    // Get the current center point before rotation
    const centerX = item.x + (item.width / 2);
    const centerY = item.y + (item.height / 2);
    
    // Rotate by 90 degrees clockwise each time
    const oldRotation = item.rotation;
    item.rotation = (item.rotation + 90) % 360;
    
    // Calculate the effective dimensions after rotation
    const effectiveDimensions = getEffectiveDimensions(item.width, item.height, item.rotation);
    
    // Calculate new position to maintain the same center point
    item.x = centerX - (effectiveDimensions.width / 2);
    item.y = centerY - (effectiveDimensions.height / 2);
    
    console.log(`Rotated to ${item.rotation}°. Center: ${centerX}, ${centerY}. New position: ${item.x}, ${item.y}`);
    
    // Ensure we have PDF data for rotated items (critical for export)
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
