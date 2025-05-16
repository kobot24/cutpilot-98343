
import { PrintPlateSize } from '../PrintPlateSettings';

type PlateGridProps = {
  plateSize: PrintPlateSize;
  scale: number;
};

export const PlateGrid = ({ plateSize, scale }: PlateGridProps) => {
  // Convert from cm to pixels using the provided scale
  const cmToPixels = (cm: number): number => {
    return cm * scale;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {/* Vertical grid lines */}
      {[...Array(Math.ceil(plateSize.width))].map((_, i) => (
        <line 
          key={`v-grid-${i}`} 
          x1={cmToPixels(i)} 
          y1="0" 
          x2={cmToPixels(i)} 
          y2="100%" 
          stroke="#f0f0f0" 
          strokeWidth="1" 
        />
      ))}
      {/* Horizontal grid lines */}
      {[...Array(Math.ceil(plateSize.height))].map((_, i) => (
        <line 
          key={`h-grid-${i}`} 
          x1="0" 
          y1={cmToPixels(i)} 
          x2="100%" 
          y2={cmToPixels(i)} 
          stroke="#f0f0f0" 
          strokeWidth="1" 
        />
      ))}
    </svg>
  );
};
