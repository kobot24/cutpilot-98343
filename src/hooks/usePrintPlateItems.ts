
import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { usePDFItemOperations } from './print-plate/usePDFItemOperations';
import { usePDFAddition } from './print-plate/usePDFAddition';

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

  return {
    items,
    setItems,
    handleAddPDF,
    handleFitToPlate,
    handleClearPlate,
    handleRotateItem,
    handleRemoveItem
  };
};
