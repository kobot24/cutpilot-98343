import { useEffect } from 'react';
import { PDFItemType } from '../PDFItem';
import { PrintPlateSize } from '../PrintPlateSettings';

export const usePlateItems = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  plateSize: PrintPlateSize,
  getCanvasHeight: () => number
) => {
  // When plate size changes, don't reposition items, just ensure they're visible
  // This preserves their position even if they end up being partly outside
  // This ensures items maintain their absolute positions on the canvas
  // The visual darkened overlay will indicate parts that extend beyond boundaries
  useEffect(() => {
    // We're deliberately not adjusting item positions when the plate size changes
    // This ensures items maintain their absolute positions on the canvas
    // The visual darkened overlay will indicate parts that extend beyond boundaries
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSize]);

  const handleRotateItem = (index: number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        // Preserve original dimensions regardless of rotation
        const newRotation = (item.rotation + 90) % 360;
        
        // Keep the width and height the same
        // Just update the rotation value
        return {
          ...item,
          rotation: newRotation
        };
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
