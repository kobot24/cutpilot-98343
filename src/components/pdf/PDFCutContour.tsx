
import React from 'react';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
  rotation?: number; // Optional rotation angle
};

export const PDFCutContour = ({ fileName, show, rotation = 0 }: PDFCutContourProps) => {
  if (!show) return null;
  
  // Important: Cut contour is always rectangular, independent of content rotation
  // We ignore the rotation for the cut contour border
  
  return (
    <>
      <div 
        className="absolute inset-x-[8%] inset-y-[8%] pointer-events-none border-4 border-red-500 border-dashed opacity-50"
        style={{
          // No rotation on the cut contour, it remains rectangular
          transform: 'none'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-red-500 font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
        {rotation !== 0 && <span className="ml-1">({rotation}°)</span>}
      </div>
    </>
  );
};
