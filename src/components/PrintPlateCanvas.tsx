
import { usePrintPlateState } from '@/hooks/usePrintPlateState';
import { usePrintPlateItems } from '@/hooks/usePrintPlateItems';
import { usePrintPlateExport } from '@/hooks/usePrintPlateExport';
import { PlateCanvasHeader } from '@/components/print-plate/panels/PlateCanvasHeader';
import { PlateCanvasPanel } from '@/components/print-plate/panels/PlateCanvasPanel';
import { PDFListPanel } from '@/components/print-plate/panels/PDFListPanel';
import { UploadedFile } from '@/types/fileTypes';

type PrintPlateCanvasProps = {
  files: UploadedFile[];
};

export const PrintPlateCanvas = ({ files }: PrintPlateCanvasProps) => {
  // Get plate size state
  const { plateSize, setPlateSize } = usePrintPlateState();
  
  // Get items state and management functions
  const { 
    items, 
    setItems, 
    handleAddPDF, 
    handleFitToPlate, 
    handleClearPlate,
    handleAutoPositionItems
  } = usePrintPlateItems(plateSize);
  
  // Get export functionality
  const { isExporting, handleExportPlate } = usePrintPlateExport(items, plateSize);

  return (
    <div className="space-y-6">
      <PlateCanvasHeader 
        itemCount={items.length}
        isExporting={isExporting}
        plateSize={plateSize}
        onSizeChange={setPlateSize}
        onClearPlate={handleClearPlate}
        onExportPlate={handleExportPlate}
        onAutoPosition={handleAutoPositionItems}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <PlateCanvasPanel 
            items={items}
            onItemsChange={setItems}
            plateSize={plateSize}
            onFitToPlate={handleFitToPlate}
          />
        </div>
        
        <div className="lg:col-span-1">
          <PDFListPanel 
            files={files}
            onAddPDF={handleAddPDF}
          />
        </div>
      </div>
    </div>
  );
};
