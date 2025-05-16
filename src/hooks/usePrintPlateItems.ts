
import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { usePDFItemOperations } from './print-plate/usePDFItemOperations';
import { usePDFAddition } from './print-plate/usePDFAddition';
import { useAutoPosition } from './print-plate/useAutoPosition';
import { toast } from '@/components/ui/sonner';

/**
 * Main hook for managing print plate items
 */
export const usePrintPlateItems = (plateSize: PrintPlateSize) => {
  const [items, setItems] = useState<PDFItemType[]>([]);
  
  // Use specialized hooks for different operations
  const { handleAddPDF } = usePDFAddition(items, setItems, plateSize);
  const { 
    handleFitToPlate, 
    handleRotateItem, 
    handleRemoveItem,
    handleClearPlate 
  } = usePDFItemOperations(items, setItems, plateSize);
  
  // Add the auto-positioning hook with enhanced features
  const { autoPositionItems, fitAllItemsToPlate } = useAutoPosition();
  
  // Auto-position all items on the plate with optimal spacing
  const handleAutoPositionItems = () => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    const positionedItems = autoPositionItems(items, plateSize);
    setItems(positionedItems);
  };
  
  // Scale and position all items to fit the plate optimally
  const handleFitAllItemsToPlate = () => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    // Check if any items exceed plate dimensions
    const oversizedItems = items.filter(item => {
      return item.width > plateSize.width || item.height > plateSize.height;
    });
    
    if (oversizedItems.length === 0) {
      toast.info("Alle Elemente passen bereits auf die Platte");
      // Still run auto-position to optimize layout
      handleAutoPositionItems();
      return;
    }
    
    const fittedItems = fitAllItemsToPlate(items, plateSize);
    setItems(fittedItems);
    toast.success("Alle Elemente wurden angepasst und positioniert");
  };

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate,
    handleRotateItem,
    handleRemoveItem,
    handleAutoPositionItems,
    handleFitAllItemsToPlate
  };
};
