
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { toast } from '@/components/ui/sonner';

/**
 * Hook for managing export status and providing user feedback
 */
export const useExportStatusHandling = () => {
  /**
   * Handle the start of an export operation
   */
  const handleExportStart = (items: PDFItemType[]) => {
    toast.info("Exportiere Druckplatte als PDF...");
    
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
  };
  
  /**
   * Handle successful export completion
   */
  const handleExportSuccess = () => {
    toast.success("Druckplatte als PDF exportiert");
  };
  
  /**
   * Handle export errors with specific user feedback
   */
  const handleExportError = (error: Error) => {
    // More specific error messages for better user feedback
    let errorMessage = "Unbekannter Fehler";
    
    if (error) {
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
  };
  
  return {
    handleExportStart,
    handleExportSuccess,
    handleExportError
  };
};
