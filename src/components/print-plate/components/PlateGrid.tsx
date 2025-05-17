
import { PrintPlateSize } from '../PrintPlateSettings';

type PlateGridProps = {
  plateSize: PrintPlateSize;
  scale: number;
  exportMode?: boolean; // New prop to control visibility during exports
};

export const PlateGrid = ({ plateSize, scale, exportMode = false }: PlateGridProps) => {
  // Exit early if in export mode - don't render the grid at all
  if (exportMode) {
    return null;
  }
  
  // Convert from cm to pixels using the provided scale
  const cmToPixels = (cm: number): number => {
    return cm * scale;
  };

  // Draw grid lines every 10cm for better readability
  const gridStep = 10;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {/* Vertical grid lines every 10cm */}
      {[...Array(Math.ceil(plateSize.width / gridStep) + 1)].map((_, i) => (
        <line 
          key={`v-grid-${i}`} 
          x1={cmToPixels(i * gridStep)} 
          y1="0" 
          x2={cmToPixels(i * gridStep)} 
          y2="100%" 
          stroke={i === 0 ? "#C9C9C9" : "#C9C9C9"} 
          strokeWidth={i === 0 ? "1" : "0.5"} 
          strokeDasharray={i === 0 ? "" : "2,2"}
          opacity={i === 0 ? "0.8" : "0.4"}
        />
      ))}
      
      {/* Horizontal grid lines every 10cm */}
      {[...Array(Math.ceil(plateSize.height / gridStep) + 1)].map((_, i) => (
        <line 
          key={`h-grid-${i}`} 
          x1="0" 
          y1={cmToPixels(i * gridStep)} 
          x2="100%" 
          y2={cmToPixels(i * gridStep)} 
          stroke={i === 0 ? "#C9C9C9" : "#C9C9C9"} 
          strokeWidth={i === 0 ? "1" : "0.5"}
          strokeDasharray={i === 0 ? "" : "2,2"}
          opacity={i === 0 ? "0.8" : "0.4"}
        />
      ))}
    </svg>
  );
};
