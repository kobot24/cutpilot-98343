
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
      
      // Check for rotated items and give additional feedback
      const hasRotatedItems = items.some(item => item.rotation !== 0);
      const rotatedItemsCount = items.filter(item => item.rotation !== 0).length;
      
      if (hasRotatedItems) {
        console.log(`Found ${rotatedItemsCount} rotated items`);
        toast.info(`Exportiere ${rotatedItemsCount} gedrehte Elemente...`, {
          duration: 3000,
        });
      }
      
      // Log if we have cached PDF data for each item
      let missingPdfDataCount = 0;
      items.forEach((item, index) => {
        if (!item.pdfData) {
          missingPdfDataCount++;
          console.log(`Item ${index}: ${item.id} - Missing cached PDF data, will fetch during export`);
        } else {
          console.log(`Item ${index}: ${item.id} - Has cached PDF data (${item.pdfData.byteLength} bytes), Rotation: ${item.rotation}°`);
        }
      });
      
      if (missingPdfDataCount > 0) {
        console.log(`Warning: ${missingPdfDataCount} items missing cached PDF data. Will fetch during export.`);
      }
      
      // Export the PDF with detailed progress information for improved debugging
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
      
      // More specific error messages for better user feedback
      let errorMessage = "Unbekannter Fehler";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common PDF-related errors
        if (error.message.includes("rotation") || error.message.includes("dreh")) {
          errorMessage = "Problem beim Exportieren von gedrehten Elementen";
        } else if (error.message.includes("memory") || error.message.includes("allocation")) {
          errorMessage = "Nicht genügend Speicher für den PDF-Export";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Netzwerkproblem beim Laden der PDF-Daten";
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
