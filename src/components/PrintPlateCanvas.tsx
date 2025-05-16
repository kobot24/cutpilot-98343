
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { UploadedFile } from '@/types/fileTypes';
import { PlateCanvas } from '@/components/print-plate/PlateCanvas';
import { PDFList } from '@/components/print-plate/PDFList';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSettings } from '@/components/print-plate/PrintPlateSettings';
import { usePrintPlateState } from '@/hooks/usePrintPlateState';
import { exportPrintPlateToPDF, downloadPDF } from '@/utils/print-plate/printPlateExporter';
import { usePDFLoader } from '@/hooks/usePDFLoader';

type PrintPlateCanvasProps = {
  files: UploadedFile[];
};

export const PrintPlateCanvas = ({ files }: PrintPlateCanvasProps) => {
  const [items, setItems] = useState<PDFItemType[]>([]);
  const { plateSize, setPlateSize } = usePrintPlateState();
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter files that have been converted to PDFs
  const pdfFiles = files.filter(file => file.convertedPdfUrl);
  
  // Estimate a good initial size for PDF items
  const getInitialItemSize = (file: UploadedFile) => {
    // Default size if we can't determine or have no aspect ratio
    const defaultWidth = 20; // 20% of canvas width
    const defaultHeight = 20; // 20% of canvas height
    
    return { width: defaultWidth, height: defaultHeight };
  };
  
  const handleAddPDF = (file: UploadedFile) => {
    if (!file.convertedPdfUrl) return;
    
    // Start with default sizes
    const { width: initialWidth, height: initialHeight } = getInitialItemSize(file);
    
    // Create a new PDF item
    const newItem: PDFItemType = {
      id: file.id,
      pdfUrl: file.convertedPdfUrl,
      x: 10,
      y: 10,
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      thumbnail: file.convertedPdfUrl,
    };
    
    setItems([...items, newItem]);
    toast.success(`${file.name} zur Druckplatte hinzugefügt`);
  };
  
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
  
  const handleClearPlate = () => {
    setItems([]);
    toast.info("Druckplatte geleert");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Printplate-Erstellung</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleClearPlate}
            disabled={items.length === 0 || isExporting}
          >
            Leeren
          </Button>
          <Button
            onClick={handleExportPlate}
            disabled={items.length === 0 || isExporting}
          >
            {isExporting ? "Exportiere..." : "Als PDF exportieren"}
          </Button>
        </div>
      </div>

      <PrintPlateSettings 
        plateSize={plateSize}
        onSizeChange={setPlateSize}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-3 h-full">
            <PlateCanvas 
              items={items} 
              onItemsChange={setItems} 
              plateSize={plateSize}
            />
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h3 className="font-medium">Verfügbare PDFs</h3>
              <p className="text-sm text-gray-500">
                {pdfFiles.length} {pdfFiles.length === 1 ? 'PDF' : 'PDFs'} verfügbar
              </p>
            </div>
            
            <PDFList pdfFiles={pdfFiles} onAddPDF={handleAddPDF} />
          </Card>
        </div>
      </div>
    </div>
  );
};
