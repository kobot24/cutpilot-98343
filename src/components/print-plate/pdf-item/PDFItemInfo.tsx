
import React from 'react';

type PDFItemInfoProps = {
  isHovered: boolean;
  showDebug: boolean;
  width: number;
  height: number;
  rotation: number;
  dpi?: number;
  x: number;
  y: number;
  exceedsBoundaries: boolean;
};

export const PDFItemInfo = ({ 
  isHovered, 
  showDebug, 
  width, 
  height, 
  rotation,
  dpi,
  x,
  y,
  exceedsBoundaries
}: PDFItemInfoProps) => {
  if (!isHovered && !showDebug) return null;
  
  return (
    <div className="absolute top-1 left-1 bg-white/80 text-xs px-2 py-1 rounded shadow-sm z-10">
      {width.toFixed(1)} × {height.toFixed(1)} cm
      {rotation !== 0 && <span className="ml-1 text-orange-500">({rotation}°)</span>}
      {dpi && <span className="ml-1 text-gray-500">({dpi} DPI)</span>}
      {showDebug && (
        <div className="text-[10px] text-gray-600 mt-1">
          x: {x.toFixed(2)}, y: {y.toFixed(2)}
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
