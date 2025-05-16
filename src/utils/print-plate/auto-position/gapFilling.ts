
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';

/**
 * Try to find alternative positions for items that didn't fit in the standard layout
 */
export const tryAlternativePosition = (
  remainingItems: PDFItemType[],
  plateSize: PrintPlateSize,
  margin: number,
  spacing: number,
  startX: number,
  startY: number
) => {
  // If there's just one item, try rotating it
  if (remainingItems.length === 1) {
    const item = JSON.parse(JSON.stringify(remainingItems[0]));
    const currentDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    
    // Try 90-degree rotation
    const rotatedDim = getEffectiveDimensions(item.width, item.height, (item.rotation + 90) % 360);
    
    if (rotatedDim.height < currentDim.height &&
        startY + rotatedDim.height <= plateSize.height - margin &&
        startX + rotatedDim.width <= plateSize.width - margin) {
      
      item.rotation = (item.rotation + 90) % 360;
      item.x = startX;
      item.y = startY;
      
      return {
        success: true,
        placedItems: [item]
      };
    }
  }
  
  // Try to fill gaps (simple implementation)
  const placedItems: PDFItemType[] = [];
  let currentItem = 0;
  
  // Look for empty spaces in rows (simplified gap filling)
  for (let y = startY; y < plateSize.height - margin && currentItem < remainingItems.length; y += 10) {
    for (let x = margin; x < plateSize.width - margin && currentItem < remainingItems.length; x += 10) {
      // Check if we can place the item here (simplified check)
      const item = JSON.parse(JSON.stringify(remainingItems[currentItem]));
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      
      if (x + effectiveDim.width <= plateSize.width - margin &&
          y + effectiveDim.height <= plateSize.height - margin) {
        
        // Check if this space overlaps with existing items (simplified check)
        let overlaps = false;
        for (const placedItem of placedItems) {
          const placedDim = getEffectiveDimensions(placedItem.width, placedItem.height, placedItem.rotation);
          
          if (!(x + effectiveDim.width < placedItem.x || 
                placedItem.x + placedDim.width < x || 
                y + effectiveDim.height < placedItem.y || 
                placedItem.y + placedDim.height < y)) {
            overlaps = true;
            break;
          }
        }
        
        if (!overlaps) {
          item.x = x;
          item.y = y;
          placedItems.push(item);
          currentItem++;
          
          // Move to next position
          x += effectiveDim.width + spacing;
        }
      }
    }
  }
  
  return {
    success: placedItems.length > 0,
    placedItems
  };
};
