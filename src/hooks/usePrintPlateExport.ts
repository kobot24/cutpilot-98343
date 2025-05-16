
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
    
    try {
      const pdfBytes = await exportPrintPlateToPDF(items, plateSize);
      
      if (pdfBytes) {
        downloadPDF(pdfBytes, "druckplatte.pdf");
        toast.success("Druckplatte als PDF exportiert");
      } else {
        toast.error("Fehler beim Exportieren der Druckplatte");
      }
    } catch (error) {
      console.error("Error exporting print plate:", error);
      toast.error("Fehler beim Exportieren: " + (error instanceof Error ? error.message : "Unbekannter Fehler"));
    } finally {
      setIsExporting(false);
    }
  };
  
  return {
    isExporting,
    handleExportPlate
  };
};
