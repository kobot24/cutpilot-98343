
import { PDFItemType } from './PDFItem';

type PDFItemInfoProps = {
  item: PDFItemType;
  isHovered: boolean;
  showDebug: boolean;
  exceedsBoundaries: boolean;
};

export const PDFItemInfo = ({ 
  item, 
  isHovered, 
  showDebug, 
  exceedsBoundaries 
}: PDFItemInfoProps) => {
  // Only show info when hovered or in debug mode
  if (!isHovered && !showDebug) return null;

  return (
    <div className="absolute top-1 left-1 bg-white/80 text-xs px-2 py-1 rounded shadow-sm z-10">
      {item.width.toFixed(1)} × {item.height.toFixed(1)} cm
      {item.rotation !== 0 && <span className="ml-1 text-orange-500">({item.rotation}°)</span>}
      {item.dpi && <span className="ml-1 text-gray-500">({item.dpi} DPI)</span>}
      {showDebug && (
        <div className="text-[10px] text-gray-600 mt-1">
          x: {item.x.toFixed(2)}, y: {item.y.toFixed(2)}
        </div>
      )}
      
      {/* Add indicator if item exceeds plate boundaries */}
      {exceedsBoundaries && (
        <div className="text-[10px] text-red-600 mt-0.5 font-medium">
          Außerhalb der Druckplatte
        </div>
      )}
    </div>
  );
};
