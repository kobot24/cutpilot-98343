
import { useState } from 'react';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { exportPrintPlateToPDF, downloadPDF } from '@/utils/print-plate/printPlateExporter';

export const usePrintPlateExport = (items: PDFItemType[], plateSize: PrintPlateSize) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExportPlate = async () => {
    if (items.length === 0) {
      toast.error("Keine Elemente auf der Druckplatte");
      return;
    }
    
    setIsExporting(true);
    toast.info("Exportiere Druckplatte als PDF...");
    
    try {
      console.log(`Starting PDF export of ${items.length} items`);
      console.log(`Plate size: ${plateSize.width}x${plateSize.height} cm`);
      
      // Log if we have cached PDF data and rotation for items
      items.forEach((item, index) => {
        console.log(`Item ${index}: ${item.id} - Has cached PDF data: ${item.pdfData ? 'Yes' : 'No'}, Rotation: ${item.rotation}°`);
      });
      
      // Check for items with rotations
      const hasRotatedItems = items.some(item => item.rotation !== 0);
      if (hasRotatedItems) {
        toast.info("Exportiere gedrehte Elemente...");
      }
      
      const pdfBytes = await exportPrintPlateToPDF(items, plateSize);
      
      if (pdfBytes && pdfBytes.length > 0) {
        console.log(`PDF export successful: ${pdfBytes.byteLength} bytes`);
        downloadPDF(pdfBytes, "druckplatte.pdf");
        toast.success("Druckplatte als PDF exportiert");
      } else {
        console.error("PDF export failed: No PDF bytes returned");
        toast.error("Fehler beim Exportieren der Druckplatte - PDF konnte nicht erzeugt werden");
      }
    } catch (error) {
      console.error("Error exporting print plate:", error);
      
      // More specific error messages
      let errorMessage = "Unbekannter Fehler";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common PDF-related errors
        if (error.message.includes("rotation") || error.message.includes("dreh")) {
          errorMessage = "Problem beim Exportieren von gedrehten Elementen";
        }
      }
      
      toast.error("Fehler beim Exportieren: " + errorMessage);
    } finally {
      setIsExporting(false);
    }
  };
  
  return {
    isExporting,
    handleExportPlate
  };
};
