
import { PrintPlateSize } from '../PrintPlateSettings';

type PlateDimensionsProps = {
  plateSize: PrintPlateSize;
  canvasHeight: number;
};

export const PlateDimensions = ({ plateSize, canvasHeight }: PlateDimensionsProps) => {
  return (
    <div className="relative">
      {/* Width dimension at top */}
      <div className="flex justify-center h-6 mb-1 text-sm text-gray-500 font-medium">
        {plateSize.width} cm
      </div>

      {/* Height dimension on left */}
      <div 
        className="absolute left-0 top-0 transform -translate-x-6 flex items-center justify-center h-full"
        style={{ width: '24px' }}
      >
        <div className="rotate-[-90deg] whitespace-nowrap text-sm text-gray-500 font-medium">
          {plateSize.height} cm
        </div>
      </div>
      
      {/* Size indicator in bottom right */}
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-gray-500 z-10">
        <span className="font-medium">{plateSize.width} × {plateSize.height} cm</span>
        <span className="block mt-0.5 text-[10px] text-gray-400">
          Einheit: 1 cm = 3.7 px
        </span>
      </div>
    </div>
  );
};
