
import React from 'react';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  if (!show) return null;
  
  return (
    <>
      {/* Removed the dashed border and replaced with a more subtle indicator */}
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-red-500 font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
