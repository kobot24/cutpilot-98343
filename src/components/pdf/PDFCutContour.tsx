
import React from 'react';
import { useSettings } from '@/hooks/useSettings';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  const { settings } = useSettings();
  
  if (!show) return null;
  
  return (
    <>
      {/* Magenta solid border exactly on top of the black line in the design */}
      <div 
        className="absolute pointer-events-none border-[1.5px] border-[#D946EF] opacity-90"
        style={{ 
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          boxSizing: 'border-box'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-[#D946EF] font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
