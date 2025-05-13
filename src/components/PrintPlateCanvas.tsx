
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { UploadedFile } from '@/types/fileTypes';
import { PlateCanvas } from '@/components/print-plate/PlateCanvas';
import { PDFList } from '@/components/print-plate/PDFList';
import { PDFItemType } from '@/components/print-plate/PDFItem';

type PrintPlateCanvasProps = {
  files: UploadedFile[];
};

export const PrintPlateCanvas = ({ files }: PrintPlateCanvasProps) => {
  const [items, setItems] = useState<PDFItemType[]>([]);
  
  // Filter files that have been converted to PDFs
  const pdfFiles = files.filter(file => file.convertedPdfUrl);
  
  const handleAddPDF = (file: UploadedFile) => {
    if (!file.convertedPdfUrl) return;
    
    // Create a new PDF item
    const newItem: PDFItemType = {
      id: file.id,
      pdfUrl: file.convertedPdfUrl,
      x: 20,
      y: 20,
      width: 100,
      height: 150,
      rotation: 0,
    };
    
    setItems([...items, newItem]);
    toast.success(`${file.name} zur Druckplatte hinzugefügt`);
  };
  
  const handleExportPlate = () => {
    // In a real app, this would create a PDF
    toast.success("Druckplatte als PDF exportiert");
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
            disabled={items.length === 0}
          >
            Leeren
          </Button>
          <Button
            onClick={handleExportPlate}
            disabled={items.length === 0}
          >
            Als PDF exportieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-3 h-full">
            <PlateCanvas items={items} onItemsChange={setItems} />
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
