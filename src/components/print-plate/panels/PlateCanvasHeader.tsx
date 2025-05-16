
import { Button } from '@/components/ui/button';
import { Grid } from 'lucide-react';

type PlateCanvasHeaderProps = {
  itemCount: number;
  isExporting: boolean;
  onClearPlate: () => void;
  onExportPlate: () => void;
  onAutoPosition: () => void;
};

export const PlateCanvasHeader = ({ 
  itemCount, 
  isExporting, 
  onClearPlate, 
  onExportPlate,
  onAutoPosition
}: PlateCanvasHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Printplate-Erstellung</h2>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onAutoPosition}
          disabled={itemCount === 0 || isExporting}
          title="Elemente automatisch platzieren"
          className="flex items-center"
        >
          <Grid className="mr-1 h-4 w-4" />
          Auto-Position
        </Button>
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
