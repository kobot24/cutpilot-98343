
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { toast } from '@/components/ui/sonner';

/**
 * Hook for handling export status and providing feedback to the user
 */
export const useExportStatusHandling = () => {
  
  const handleExportStart = (items: PDFItemType[]) => {
    // Start export process with user feedback
    toast.info(`Exportiere ${items.length} Element${items.length !== 1 ? 'e' : ''}`);
    
    // Log export start
    console.log(`Starting PDF export of ${items.length} items`);
    
    // Warn about large exports
    if (items.length > 10) {
      console.log('Warning: Exporting a large number of items may take some time');
      toast.info(`Großer Export - dies kann einen Moment dauern`);
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
  
  const handleExportSuccess = () => {
    toast.success('Export erfolgreich');
    console.log('PDF export completed successfully');
  };
  
  const handleExportError = (error: Error) => {
    toast.error(`Export fehlgeschlagen: ${error.message}`);
    console.error('PDF export failed:', error);
  };
  
  return {
    handleExportStart,
    handleExportSuccess,
    handleExportError
  };
};
