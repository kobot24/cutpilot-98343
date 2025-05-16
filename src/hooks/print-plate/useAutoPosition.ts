
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';

/**
 * Hook for auto-positioning items on the print plate
 * @returns Functions for auto-positioning items
 */
export const useAutoPosition = () => {
  /**
   * Automatically position all items on the plate with optimal spacing
   * @param items Current plate items
   * @param plateSize Dimensions of the print plate
   * @returns New array of positioned items
   */
  const autoPositionItems = (items: PDFItemType[], plateSize: PrintPlateSize): PDFItemType[] => {
    if (items.length === 0) {
      return items;
    }
    
    // Make a deep copy of items to avoid modifying the original array
    const newItems = JSON.parse(JSON.stringify(items));
    
    // Check if any items exceed plate size before positioning
    const oversizedItems = newItems.filter((item: PDFItemType) => {
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      return effectiveDim.width > plateSize.width || effectiveDim.height > plateSize.height;
    });
    
    if (oversizedItems.length > 0) {
      toast.warning(`${oversizedItems.length} Elemente sind größer als die Druckplatte. Passen Sie die Größe an.`);
    }
    
    // Calculate total area of all items
    const totalItemArea = newItems.reduce((total: number, item: PDFItemType) => {
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      return total + (effectiveDim.width * effectiveDim.height);
    }, 0);
    
    const plateArea = plateSize.width * plateSize.height;
    const fillRatio = totalItemArea / plateArea;
    
    // Choose appropriate margin and spacing based on fill ratio
    let MARGIN_CM = 0.5; // Default margin
    let SPACING_CM = 0.5; // Default spacing
    
    // Adjust margins and spacing based on fill ratio
    if (fillRatio > 0.8) {
      // If items are taking up a lot of space, use smaller margins
      MARGIN_CM = 0.2;
      SPACING_CM = 0.2;
    } else if (fillRatio > 0.6) {
      // Moderate space optimization
      MARGIN_CM = 0.3;
      SPACING_CM = 0.3;
    }
    
    // Try different packing strategies
    const result = tryPackStrategies(newItems, plateSize, MARGIN_CM, SPACING_CM);
    
    if (result.success) {
      toast.success(`${result.itemsPlaced} von ${newItems.length} Elementen erfolgreich positioniert`);
      return result.items;
    } else {
      toast.warning(`Nur ${result.itemsPlaced} von ${newItems.length} Elementen konnten positioniert werden`);
      return result.items;
    }
  };
  
  /**
   * Try different packing strategies to find the best arrangement
   */
  const tryPackStrategies = (
    items: PDFItemType[], 
    plateSize: PrintPlateSize, 
    margin: number, 
    spacing: number
  ) => {
    // Make copies for each strategy
    const itemsForRowFirst = JSON.parse(JSON.stringify(items));
    const itemsForColumnFirst = JSON.parse(JSON.stringify(items));
    const itemsForOptimized = JSON.parse(JSON.stringify(items));
    
    // Try row-first packing (sort by width)
    itemsForRowFirst.sort((a: PDFItemType, b: PDFItemType) => {
      const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      return bEffectiveDim.width - aEffectiveDim.width; // Widest first
    });
    const rowResult = packRowFirst(itemsForRowFirst, plateSize, margin, spacing);
    
    // Try column-first packing (sort by height)
    itemsForColumnFirst.sort((a: PDFItemType, b: PDFItemType) => {
      const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      return bEffectiveDim.height - aEffectiveDim.height; // Tallest first
    });
    const columnResult = packColumnFirst(itemsForColumnFirst, plateSize, margin, spacing);
    
    // Try area-optimized packing (sort by area)
    itemsForOptimized.sort((a: PDFItemType, b: PDFItemType) => {
      const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      const aArea = aEffectiveDim.width * aEffectiveDim.height;
      const bArea = bEffectiveDim.width * bEffectiveDim.height;
      return bArea - aArea; // Largest area first
    });
    const areaResult = packRowFirst(itemsForOptimized, plateSize, margin, spacing);
    
    // Choose the best result (most items placed)
    if (rowResult.itemsPlaced >= columnResult.itemsPlaced && rowResult.itemsPlaced >= areaResult.itemsPlaced) {
      return rowResult;
    } else if (columnResult.itemsPlaced >= rowResult.itemsPlaced && columnResult.itemsPlaced >= areaResult.itemsPlaced) {
      return columnResult;
    } else {
      return areaResult;
    }
  };
  
  /**
   * Pack items row by row (horizontal-first strategy)
   */
  const packRowFirst = (
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
  const packColumnFirst = (
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
  
  /**
   * Try to find alternative positions for items that didn't fit in the standard layout
   */
  const tryAlternativePosition = (
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

  return {
    autoPositionItems
  };
};
