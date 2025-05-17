
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
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
    
    // Log item details for debugging purposes
    let missingUrlCount = 0;
    items.forEach((item, index) => {
      if (!item.pdfUrl) {
        missingUrlCount++;
        console.log(`Item ${index}: ${item.id} - Missing PDF URL, cannot export properly`);
      } else {
        console.log(`Item ${index}: ${item.id} - Has PDF URL, Rotation: ${item.rotation}°`);
      }
    });
    
    if (missingUrlCount > 0) {
      console.log(`Warning: ${missingUrlCount} items missing PDF URLs. Export may be incomplete.`);
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
