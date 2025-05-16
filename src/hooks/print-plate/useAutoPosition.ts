
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { calculateSizingMetrics, determineOptimalSpacing, tryPackStrategies } from '@/utils/print-plate/auto-position/packingUtils';

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
    
    // Calculate sizing metrics and identify oversized items
    const { fillRatio, oversizedItems } = calculateSizingMetrics(newItems, plateSize);
    
    if (oversizedItems.length > 0) {
      toast.warning(`${oversizedItems.length} Elemente sind größer als die Druckplatte. Passen Sie die Größe an.`);
    }
    
    // Determine optimal margins and spacing
    const { MARGIN_CM, SPACING_CM } = determineOptimalSpacing(fillRatio);
    
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

  return {
    autoPositionItems
  };
};
