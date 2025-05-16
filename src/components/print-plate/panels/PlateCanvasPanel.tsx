
import { Card } from '@/components/ui/card';
import { PlateCanvas } from '@/components/print-plate/PlateCanvas';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';

type PlateCanvasPanelProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
  plateSize: PrintPlateSize;
  onFitToPlate: (index: number) => void;
};

export const PlateCanvasPanel = ({ 
  items, 
  onItemsChange, 
  plateSize,
  onFitToPlate 
}: PlateCanvasPanelProps) => {
  return (
    <Card className="p-3 h-full">
      <PlateCanvas 
        items={items} 
        onItemsChange={onItemsChange} 
        plateSize={plateSize}
        onFitToPlate={onFitToPlate}
      />
    </Card>
  );
};
