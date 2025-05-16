import { useEffect } from 'react';
import { PDFItemType } from '../PDFItem';
import { PrintPlateSize } from '../PrintPlateSettings';

export const usePlateItems = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  plateSize: PrintPlateSize,
  getCanvasHeight: () => number
) => {
  // Adjust item size and position when the plate size changes
  useEffect(() => {
    if (items.length > 0) {
      // Make sure items stay within plate boundaries after resizing
      const updatedItems = items.map(item => {
        // Keep same positions relative to plate dimensions
        const newItem = { ...item };
        
        // Ensure item is within plate boundaries
        if (newItem.x + newItem.width > plateSize.width) {
          newItem.x = Math.max(0, plateSize.width - newItem.width);
        }
        
        if (newItem.y + newItem.height > plateSize.height) {
          newItem.y = Math.max(0, plateSize.height - newItem.height);
        }
        
        return newItem;
      });
      
      onItemsChange(updatedItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSize]);

  const handleRotateItem = (index: number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        // When rotating, we need to swap width and height to maintain aspect ratio
        const newRotation = (item.rotation + 90) % 360;
        let newItem = { ...item, rotation: newRotation };
        
        // If rotation is 90 or 270 degrees, swap width and height
        if ((newRotation % 180) === 90) {
          if (item.aspectRatio) {
            // Calculate new dimensions based on aspect ratio
            const aspectRatio = 1 / item.aspectRatio; // Invert for rotation
            newItem = {
              ...newItem,
              width: item.height,
              height: item.width
            };
          }
        }
        
        return newItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  return {
    handleRotateItem,
    handleRemoveItem
  };
};
