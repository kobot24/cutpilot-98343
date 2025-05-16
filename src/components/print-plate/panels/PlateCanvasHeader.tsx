
import { Button } from '@/components/ui/button';
import { Grid, RefreshCw } from 'lucide-react';
import { PrintPlateSettings } from '@/components/print-plate/PrintPlateSettings';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';

type PlateCanvasHeaderProps = {
  itemCount: number;
  isExporting: boolean;
  plateSize: PrintPlateSize;
  onSizeChange: (size: PrintPlateSize) => void;
  onClearPlate: () => void;
  onExportPlate: () => void;
  onAutoPosition: () => void;
};

export const PlateCanvasHeader = ({ 
  itemCount, 
  isExporting,
  plateSize,
  onSizeChange,
  onClearPlate, 
  onExportPlate,
  onAutoPosition
}: PlateCanvasHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold">Printplate-Erstellung</h2>
        <PrintPlateSettings 
          plateSize={plateSize}
          onSizeChange={onSizeChange}
        />
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onAutoPosition}
          disabled={itemCount === 0 || isExporting}
          title="Elemente automatisch optimal anordnen"
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
          className="flex items-center"
        >
          {isExporting ? (
            <>
              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              Exportiere...
            </>
          ) : "Als PDF exportieren"}
        </Button>
      </div>
    </div>
  );
};
