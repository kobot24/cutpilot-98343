
import React from 'react';
import { useSettings } from '@/hooks/useSettings';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  const { settings } = useSettings();
  
  if (!show) return null;
  
  // Use a fixed position that follows the exact edge instead of percentage inset
  // This will align the CutContour with the black border in the design
  
  return (
    <>
      {/* Magenta solid border following the exact edge of the content */}
      <div 
        className="absolute pointer-events-none border-[1.5px] border-[#D946EF] opacity-90"
        style={{ 
          inset: '0', // Place exactly at the edge of the PDF content
          boxSizing: 'border-box'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-[#D946EF] font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
