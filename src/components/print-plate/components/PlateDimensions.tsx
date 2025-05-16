
import { PrintPlateSize } from '../PrintPlateSettings';

type PlateDimensionsProps = {
  plateSize: PrintPlateSize;
  canvasHeight: number;
};

export const PlateDimensions = ({ plateSize, canvasHeight }: PlateDimensionsProps) => {
  return (
    <>
      {/* Width dimension at top */}
      <div className="flex justify-center h-6 mb-1 text-sm text-gray-500 font-medium">
        {plateSize.width} cm
      </div>

      {/* Height dimension on left */}
      <div 
        className="flex flex-col items-center justify-center w-6 mr-1 text-sm text-gray-500 font-medium" 
        style={{ height: `${canvasHeight}px` }}
      >
        <div className="rotate-[-90deg] whitespace-nowrap">{plateSize.height} cm</div>
      </div>
      
      {/* Size indicator in bottom right */}
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-gray-500">
        {plateSize.width} × {plateSize.height} cm
      </div>
    </>
  );
};
