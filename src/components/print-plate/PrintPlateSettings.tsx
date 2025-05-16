
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';

export type PrintPlateSize = {
  width: number;  // in cm
  height: number; // in cm
};

// Update default size to match usePrintPlateState
const DEFAULT_SIZE: PrintPlateSize = {
  width: 300,
  height: 200
};

type PrintPlateSettingsProps = {
  plateSize: PrintPlateSize;
  onSizeChange: (size: PrintPlateSize) => void;
  className?: string;
};

export const PrintPlateSettings = ({
  plateSize,
  onSizeChange,
  className = "",
}: PrintPlateSettingsProps) => {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseFloat(e.target.value);
    if (isNaN(newWidth) || newWidth <= 0) return;
    
    onSizeChange({ ...plateSize, width: newWidth });
    toast.success('Druckplattenbreite aktualisiert');
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseFloat(e.target.value);
    if (isNaN(newHeight) || newHeight <= 0) return;
    
    onSizeChange({ ...plateSize, height: newHeight });
    toast.success('Druckplattenhöhe aktualisiert');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm whitespace-nowrap">Breite:</span>
        <Input
          type="number"
          min="1"
          step="0.1"
          value={plateSize.width}
          onChange={handleWidthChange}
          className="h-9 w-24"
        />
        <span className="text-sm">cm</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-sm whitespace-nowrap">Höhe:</span>
        <Input
          type="number" 
          min="1"
          step="0.1"
          value={plateSize.height}
          onChange={handleHeightChange}
          className="h-9 w-24"
        />
        <span className="text-sm">cm</span>
      </div>
    </div>
  );
};
