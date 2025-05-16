
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
    
    // Try different approaches based on item count and sizes
    const totalItemArea = newItems.reduce((total: number, item: PDFItemType) => {
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      return total + (effectiveDim.width * effectiveDim.height);
    }, 0);
    
    const plateArea = plateSize.width * plateSize.height;
    const fillRatio = totalItemArea / plateArea;
    
    // Choose appropriate margin based on fill ratio
    let MARGIN_CM = 0.5; // Default margin
    if (fillRatio > 0.8) {
      // If items are taking up a lot of space, use smaller margins
      MARGIN_CM = 0.2;
    }
    
    // Sort items by height (tallest first) to optimize space usage
    // For better packing, we'll try a smarter approach
    newItems.sort((a: PDFItemType, b: PDFItemType) => {
      const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      
      // Sort by area (largest first) for better space optimization
      const aArea = aEffectiveDim.width * aEffectiveDim.height;
      const bArea = bEffectiveDim.width * bEffectiveDim.height;
      return bArea - aArea;
    });
    
    // Constants for layout - minimal spacing for tight packing
    const SPACING_CM = 0.1; // Small spacing between items
    
    // Initialize position trackers
    let currentX = MARGIN_CM;
    let currentY = MARGIN_CM;
    let rowHeight = 0;
    let itemsPlaced = 0;
    
    // Position each item
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      
      // Get effective width and height based on rotation
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      
      // Check if we need to start a new row
      if (currentX + effectiveDim.width > plateSize.width - MARGIN_CM) {
        currentX = MARGIN_CM;
        currentY += rowHeight + SPACING_CM;
        rowHeight = 0;
      }
      
      // Check if we need to stop (if item doesn't fit in height)
      if (currentY + effectiveDim.height > plateSize.height - MARGIN_CM) {
        // Try alternative layout for remaining items - second column if there's space
        const remainingItems = newItems.slice(i);
        const alternativeLayout = tryAlternativeLayout(remainingItems, plateSize, itemsPlaced, MARGIN_CM, SPACING_CM);
        
        if (alternativeLayout.success) {
          // Apply alternative layout positions to our items
          for (let j = 0; j < alternativeLayout.positionedItems.length; j++) {
            const altItem = alternativeLayout.positionedItems[j];
            newItems[i + j].x = altItem.x;
            newItems[i + j].y = altItem.y;
            itemsPlaced++;
          }
          break;
        }
        
        // Don't show warning if at least some items were placed
        if (itemsPlaced === 0) {
          toast.warning("Die erste Datei ist zu groß für die Druckplatte");
        } else if (i < newItems.length) {
          toast.warning(`${itemsPlaced} von ${newItems.length} Elementen wurden positioniert. Die restlichen passen nicht auf die Platte.`);
        }
        break; // Stop adding items if we run out of space
      }
      
      // Position the item - this now correctly accounts for rotation
      item.x = currentX;
      item.y = currentY;
      itemsPlaced++;
      
      console.log(`Auto Position - Item ${i}: x=${currentX}, y=${currentY}, w=${effectiveDim.width}, h=${effectiveDim.height}, rot=${item.rotation}°`);
      
      // Update position trackers
      currentX += effectiveDim.width + SPACING_CM;
      rowHeight = Math.max(rowHeight, effectiveDim.height);
    }
    
    // If we positioned all items, show success message
    if (itemsPlaced === newItems.length) {
      toast.success(`${itemsPlaced} Elemente wurden erfolgreich positioniert`);
    }
    
    return newItems;
  };

  /**
   * Try to fit items in alternative layouts when standard packing fails
   */
  const tryAlternativeLayout = (
    items: PDFItemType[], 
    plateSize: PrintPlateSize, 
    alreadyPlaced: number,
    margin: number,
    spacing: number
  ) => {
    // If there's just one item left, try rotating it
    if (items.length === 1) {
      const item = JSON.parse(JSON.stringify(items[0]));
      const originalDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      
      // Try rotating by 90 degrees if that would help
      const rotatedDim = getEffectiveDimensions(item.width, item.height, (item.rotation + 90) % 360);
      
      if (
        rotatedDim.width <= plateSize.width - 2 * margin &&
        rotatedDim.height <= plateSize.height - 2 * margin &&
        (originalDim.width > plateSize.width - 2 * margin || originalDim.height > plateSize.height - 2 * margin)
      ) {
        // Rotation helps, apply it
        item.rotation = (item.rotation + 90) % 360;
        item.x = margin;
        item.y = margin;
        return {
          success: true,
          positionedItems: [item]
        };
      }
    }
    
    // Try positioning items in columns
    const columnItems = tryColumnLayout(items, plateSize, margin, spacing);
    if (columnItems.length > 0) {
      return {
        success: true,
        positionedItems: columnItems
      };
    }
    
    return {
      success: false,
      positionedItems: []
    };
  };
  
  /**
   * Try to position items in columns (for items that don't fit in a row layout)
   */
  const tryColumnLayout = (
    items: PDFItemType[],
    plateSize: PrintPlateSize,
    margin: number,
    spacing: number
  ): PDFItemType[] => {
    // Deep copy to avoid modifying originals
    const itemsCopy = JSON.parse(JSON.stringify(items));
    
    // Sort by width (narrowest first) for column layout
    itemsCopy.sort((a: PDFItemType, b: PDFItemType) => {
      const aDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      return aDim.width - bDim.width;
    });
    
    // Try to position items in columns
    let currentX = margin;
    const positionedItems: PDFItemType[] = [];
    
    for (const item of itemsCopy) {
      const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
      
      // If item is too wide for a column, try rotating it
      if (effectiveDim.width > plateSize.width / 3 && effectiveDim.height < plateSize.width / 3) {
        // Rotate 90 degrees
        item.rotation = (item.rotation + 90) % 360;
        const rotatedDim = getEffectiveDimensions(item.width, item.height, item.rotation);
        
        // Check if it fits after rotation
        if (rotatedDim.width <= plateSize.width / 2) {
          effectiveDim.width = rotatedDim.width;
          effectiveDim.height = rotatedDim.height;
        } else {
          // Undo rotation if it doesn't help
          item.rotation = (item.rotation + 270) % 360;
        }
      }
      
      // If this item would exceed the plate width, start a new column
      if (currentX + effectiveDim.width > plateSize.width - margin) {
        break; // Stop if we can't fit more columns
      }
      
      // Position at the top of this column
      item.x = currentX;
      item.y = margin;
      positionedItems.push(item);
      
      // Move to next column
      currentX += effectiveDim.width + spacing;
    }
    
    return positionedItems;
  };

  /**
   * Automatically scale and fit all items on the plate
   */
  const fitAllItemsToPlate = (items: PDFItemType[], plateSize: PrintPlateSize): PDFItemType[] => {
    if (items.length === 0) {
      return items;
    }
    
    // Make a deep copy of items
    const newItems = JSON.parse(JSON.stringify(items));
    
    // Calculate total area of all items and available plate area
    const totalItemArea = newItems.reduce((total: number, item: PDFItemType) => {
      return total + (item.width * item.height);
    }, 0);
    
    // Calculate usable plate area (leaving margins)
    const MARGIN_CM = 0.5;
    const usablePlateWidth = plateSize.width - (2 * MARGIN_CM);
    const usablePlateHeight = plateSize.height - (2 * MARGIN_CM);
    const usablePlateArea = usablePlateWidth * usablePlateHeight;
    
    // If total item area exceeds usable plate area, scale all items
    if (totalItemArea > usablePlateArea * 0.95) {
      // Calculate scale factor needed
      const scaleFactor = Math.sqrt(usablePlateArea * 0.9 / totalItemArea);
      
      // Apply scaling to all items
      for (const item of newItems) {
        item.width *= scaleFactor;
        item.height *= scaleFactor;
      }
      
      toast.success(`Elemente wurden auf ${Math.round(scaleFactor * 100)}% skaliert, um auf die Platte zu passen`);
    }
    
    // Position the scaled items
    return autoPositionItems(newItems, plateSize);
  };

  return {
    autoPositionItems,
    fitAllItemsToPlate
  };
};
