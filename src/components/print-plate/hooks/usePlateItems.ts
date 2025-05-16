import { useRef, useEffect } from 'react';
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
      const canvasWidth = window.innerWidth; // Approximation, will be refined in the calculation
      const canvasHeight = getCanvasHeight();
      
      if (canvasHeight > 0) {
        // Adjust items to fit the new canvas size
        const updatedItems = items.map(item => {
          // Keep the same relative position and size
          const relX = item.x / canvasWidth;
          const relY = item.y / canvasHeight;
          const relWidth = item.width / canvasWidth;
          const relHeight = item.height / canvasHeight;
          
          return {
            ...item,
            x: relX * canvasWidth,
            y: relY * canvasHeight,
            width: relWidth * canvasWidth,
            height: relHeight * canvasHeight
          };
        });
        
        onItemsChange(updatedItems);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSize]);

  const handleRotateItem = (index: number) => {
    const updatedItems = items.map((item, i) => 
      i === index 
        ? { ...item, rotation: (item.rotation + 90) % 360 } 
        : item
    );
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
