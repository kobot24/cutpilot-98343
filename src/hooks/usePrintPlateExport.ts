
import { useState } from 'react';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { exportPrintPlateToPDF, downloadPDF } from '@/utils/print-plate/printPlateExporter';
import { useExportStatusHandling } from './print-plate/useExportStatusHandling';
import { clearPDFDataCache } from '@/utils/print-plate/pdfDataUtils';

export const usePrintPlateExport = (items: PDFItemType[], plateSize: PrintPlateSize) => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Use the dedicated hook for status handling and feedback
  const { handleExportStart, handleExportSuccess, handleExportError } = useExportStatusHandling();
  
  const handleExportPlate = async () => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    setIsExporting(true);
    handleExportStart(items);
    
    try {
      console.log(`Starting PDF export of ${items.length} items`);
      console.log(`Plate size: ${plateSize.width}x${plateSize.height} cm`);
      
      // Verify all items have unique IDs
      const uniqueIds = new Set(items.map(item => item.id));
      if (uniqueIds.size !== items.length) {
        console.warn(`Warning: Found duplicate item IDs! Only ${uniqueIds.size} unique IDs for ${items.length} items.`);
      }
      
      // Verify all URLs are valid
      const invalidItems = items.filter(item => !item.pdfUrl).length;
      if (invalidItems > 0) {
        console.warn(`Warning: Found ${invalidItems} items with missing PDF URLs!`);
      }
      
      // Clear the cache before export to ensure fresh data
      clearPDFDataCache();
      
      // Export the PDF using the utility function
      const pdfBytes = await exportPrintPlateToPDF(items, plateSize);
      
      if (pdfBytes && pdfBytes.length > 0) {
        console.log(`PDF export successful: ${pdfBytes.byteLength} bytes`);
        downloadPDF(pdfBytes, "druckplatte.pdf");
        handleExportSuccess();
      } else {
        console.error("PDF export failed: No PDF bytes returned");
        handleExportError(new Error("PDF konnte nicht erzeugt werden"));
      }
    } catch (error) {
      console.error("Error exporting print plate:", error);
      handleExportError(error instanceof Error ? error : new Error("Unbekannter Fehler"));
    } finally {
      setIsExporting(false);
    }
  };
  
  return {
    isExporting,
    handleExportPlate
  };
};
