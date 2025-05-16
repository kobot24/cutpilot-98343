
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';

/**
 * Hook for auto-positioning items on the print plate
 * @returns Functions for auto-positioning items
 */
export const useAutoPosition = () => {
  /**
   * Automatically position all items on the plate with 1px spacing between them
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
      const aHeight = a.rotation === 90 || a.rotation === 270 ? a.width : a.height;
      const bHeight = b.rotation === 90 || b.rotation === 270 ? b.width : b.height;
      return bHeight - aHeight;
    });
    
    // Constants for layout
    const SPACING_CM = 0.05; // 1px is roughly 0.03-0.05cm depending on DPI
    const MARGIN_CM = 0.5; // Small margin from the edges
    
    // Initialize position trackers
    let currentX = MARGIN_CM;
    let currentY = MARGIN_CM;
    let rowHeight = 0;
    
    // Position each item
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      
      // Get effective width and height based on rotation
      const effectiveWidth = item.rotation === 90 || item.rotation === 270 ? item.height : item.width;
      const effectiveHeight = item.rotation === 90 || item.rotation === 270 ? item.width : item.height;
      
      // Check if we need to start a new row
      if (currentX + effectiveWidth > plateSize.width - MARGIN_CM) {
        currentX = MARGIN_CM;
        currentY += rowHeight + SPACING_CM;
        rowHeight = 0;
      }
      
      // Check if we need to start a new column (if item doesn't fit in height)
      if (currentY + effectiveHeight > plateSize.height - MARGIN_CM) {
        toast.warning("Nicht alle Elemente passen auf die Druckplatte");
        break; // Stop adding items if we run out of space
      }
      
      // Position the item
      item.x = currentX;
      item.y = currentY;
      
      // Update position trackers
      currentX += effectiveWidth + SPACING_CM;
      rowHeight = Math.max(rowHeight, effectiveHeight);
    }
    
    return newItems;
  };

  return {
    autoPositionItems
  };
};
