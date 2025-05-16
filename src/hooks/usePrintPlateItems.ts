
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
  
  // Add the auto-positioning hook
  const { autoPositionItems } = useAutoPosition();
  
  // Auto-position all items on the plate with 1px spacing
  const handleAutoPositionItems = () => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    const positionedItems = autoPositionItems(items, plateSize);
    setItems(positionedItems);
    toast.success(`${positionedItems.length} Elemente wurden automatisch positioniert`);
  };

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate,
    handleRotateItem,
    handleRemoveItem,
    handleAutoPositionItems
  };
};
