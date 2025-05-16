
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
   * Automatically position all items on the plate with spacing between them
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
    
    // Sort items by height (tallest first) to optimize space usage
    newItems.sort((a: PDFItemType, b: PDFItemType) => {
      // Use the effective dimensions based on rotation
      const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
      const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
      
      return bEffectiveDim.height - aEffectiveDim.height;
    });
    
    // Constants for layout
    const SPACING_CM = 0.5; // Spacing between items (0.5cm)
    const MARGIN_CM = 0.5; // Small margin from the edges
    
    // Initialize position trackers
    let currentX = MARGIN_CM;
    let currentY = MARGIN_CM;
    let rowHeight = 0;
    
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
      
      // Check if we need to start a new column (if item doesn't fit in height)
      if (currentY + effectiveDim.height > plateSize.height - MARGIN_CM) {
        toast.warning("Nicht alle Elemente passen auf die Druckplatte");
        break; // Stop adding items if we run out of space
      }
      
      // Position the item
      item.x = currentX;
      item.y = currentY;
      
      console.log(`Auto Position - Item ${i}: x=${currentX}, y=${currentY}, w=${effectiveDim.width}, h=${effectiveDim.height}, rot=${item.rotation}°`);
      
      // Update position trackers
      currentX += effectiveDim.width + SPACING_CM;
      rowHeight = Math.max(rowHeight, effectiveDim.height);
    }
    
    return newItems;
  };

  return {
    autoPositionItems
  };
};
