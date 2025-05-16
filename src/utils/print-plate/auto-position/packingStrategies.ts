
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';
import { tryAlternativePosition } from './gapFilling';

/**
 * Pack items row by row (horizontal-first strategy)
 */
export const packRowFirst = (
  items: PDFItemType[], 
  plateSize: PrintPlateSize, 
  margin: number, 
  spacing: number
) => {
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;
  let itemsPlaced = 0;
  
  // Check if we should try to rotate items for better fit
  const shouldTryRotation = plateSize.width >= plateSize.height * 1.5; // Wide plate
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Get effective dimensions based on current rotation
    let effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    
    // Try rotating if it would fit better in a wide plate
    if (shouldTryRotation && 
        effectiveDim.width > effectiveDim.height && 
        effectiveDim.width > plateSize.width / 2 && 
        effectiveDim.height < plateSize.width / 2) {
      
      // Try a 90 degree rotation
      const rotatedDim = getEffectiveDimensions(item.width, item.height, (item.rotation + 90) % 360);
      
      // Use the rotation if it's more space-efficient
      if (rotatedDim.width < effectiveDim.width && rotatedDim.height <= plateSize.height - margin * 2) {
        item.rotation = (item.rotation + 90) % 360;
        effectiveDim = rotatedDim;
      }
    }
    
    // Check if we need to start a new row
    if (currentX + effectiveDim.width > plateSize.width - margin) {
      currentX = margin;
      currentY += rowHeight + spacing;
      rowHeight = 0;
    }
    
    // Check if this item fits in height
    if (currentY + effectiveDim.height > plateSize.height - margin) {
      // Try a different position if possible
      const alternativeResult = tryAlternativePosition(items.slice(i), plateSize, margin, spacing, currentX, currentY);
      
      if (alternativeResult.success) {
        // Apply alternative positions
        for (let j = 0; j < alternativeResult.placedItems.length; j++) {
          const idx = i + j;
          if (idx < items.length) {
            const altItem = alternativeResult.placedItems[j];
            items[idx].x = altItem.x;
            items[idx].y = altItem.y;
            items[idx].rotation = altItem.rotation;
            itemsPlaced++;
          }
        }
      }
      
      break; // Stop the main positioning loop
    }
    
    // Position the item
    item.x = currentX;
    item.y = currentY;
    itemsPlaced++;
    
    // Update position trackers
    currentX += effectiveDim.width + spacing;
    rowHeight = Math.max(rowHeight, effectiveDim.height);
  }
  
  return {
    success: itemsPlaced === items.length,
    itemsPlaced,
    items
  };
};

/**
 * Pack items column by column (vertical-first strategy)
 */
export const packColumnFirst = (
  items: PDFItemType[], 
  plateSize: PrintPlateSize, 
  margin: number, 
  spacing: number
) => {
  let currentX = margin;
  let currentY = margin;
  let columnWidth = 0;
  let itemsPlaced = 0;
  
  // Check if we should try to rotate items for better fit
  const shouldTryRotation = plateSize.height >= plateSize.width * 1.5; // Tall plate
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Get effective dimensions based on current rotation
    let effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    
    // Try rotating if it would fit better in a tall plate
    if (shouldTryRotation && 
        effectiveDim.height > effectiveDim.width && 
        effectiveDim.height > plateSize.height / 2 && 
        effectiveDim.width < plateSize.height / 2) {
      
      // Try a 90 degree rotation
      const rotatedDim = getEffectiveDimensions(item.width, item.height, (item.rotation + 90) % 360);
      
      // Use the rotation if it's more space-efficient
      if (rotatedDim.height < effectiveDim.height && rotatedDim.width <= plateSize.width - margin * 2) {
        item.rotation = (item.rotation + 90) % 360;
        effectiveDim = rotatedDim;
      }
    }
    
    // Check if we need to start a new column
    if (currentY + effectiveDim.height > plateSize.height - margin) {
      currentY = margin;
      currentX += columnWidth + spacing;
      columnWidth = 0;
    }
    
    // Check if this item fits in width
    if (currentX + effectiveDim.width > plateSize.width - margin) {
      break; // Stop positioning as we've run out of horizontal space
    }
    
    // Position the item
    item.x = currentX;
    item.y = currentY;
    itemsPlaced++;
    
    // Update position trackers
    currentY += effectiveDim.height + spacing;
    columnWidth = Math.max(columnWidth, effectiveDim.width);
  }
  
  return {
    success: itemsPlaced === items.length,
    itemsPlaced,
    items
  };
};
