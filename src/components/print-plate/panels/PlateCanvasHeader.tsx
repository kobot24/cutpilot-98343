
import { Button } from '@/components/ui/button';

type PlateCanvasHeaderProps = {
  itemCount: number;
  isExporting: boolean;
  onClearPlate: () => void;
  onExportPlate: () => void;
};

export const PlateCanvasHeader = ({ 
  itemCount, 
  isExporting, 
  onClearPlate, 
  onExportPlate 
}: PlateCanvasHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Printplate-Erstellung</h2>
      <div className="flex space-x-2">
        <Button 
          variant="outline"
          onClick={onClearPlate}
          disabled={itemCount === 0 || isExporting}
        >
          Leeren
        </Button>
        <Button
          onClick={onExportPlate}
          disabled={itemCount === 0 || isExporting}
        >
          {isExporting ? "Exportiere..." : "Als PDF exportieren"}
        </Button>
      </div>
    </div>
  );
};
