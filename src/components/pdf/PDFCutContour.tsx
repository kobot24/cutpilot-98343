
import React from 'react';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  if (!show) return null;
  
  return (
    <>
      {/* Add magenta border to show the cut contour visually */}
      <div className="absolute inset-x-[8%] inset-y-[8%] pointer-events-none border-2 border-[#D946EF] border-dashed opacity-70" />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-[#D946EF] font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
