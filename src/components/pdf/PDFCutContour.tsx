
import React from 'react';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  if (!show) return null;
  
  return (
    <>
      <div className="absolute inset-x-[8%] inset-y-[8%] pointer-events-none border-4 border-red-500 border-dashed opacity-50" />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-red-500 font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
