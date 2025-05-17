
import { useState, useCallback } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { usePDFItemOperations } from './print-plate/usePDFItemOperations';
import { usePDFAddition } from './print-plate/usePDFAddition';
import { useAutoPosition } from './print-plate/useAutoPosition';
import { toast } from '@/components/ui/sonner';
import { prefetchPDFData } from '@/utils/print-plate/pdfDataUtils';

/**
 * Main hook for managing print plate items with performance optimizations
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
  const { autoPositionItems } = useAutoPosition();
  
  // Auto-position all items on the plate with optimal spacing
  const handleAutoPositionItems = useCallback(() => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    const positionedItems = autoPositionItems(items, plateSize);
    setItems(positionedItems);
    toast.success("Elemente automatisch positioniert");
  }, [items, plateSize, autoPositionItems]);

  // Prefetch PDF data for optimal performance
  const handlePrefetchPDFData = useCallback(async (file: UploadedFile) => {
    if (file.convertedPdfUrl) {
      await prefetchPDFData(file.convertedPdfUrl);
    }
  }, []);

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate,
    handleRotateItem,
    handleRemoveItem,
    handleAutoPositionItems,
    handlePrefetchPDFData
  };
};
