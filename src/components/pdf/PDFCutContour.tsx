
import React from 'react';
import { useSettings } from '@/hooks/useSettings';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  const { settings } = useSettings();
  
  if (!show) return null;
  
  // Use RGB equivalent of 100% Magenta for browser display
  // This matches exactly the CMYK (0,100,0,0) value used in the PDF
  return (
    <>
      {/* Magenta solid border exactly on top of the black line in the design */}
      <div 
        className="absolute pointer-events-none"
        style={{ 
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: '0.1pt solid rgb(255,0,142)', // RGB equivalent of 100% Magenta
          opacity: 0.9,
          boxSizing: 'border-box'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded font-medium"
           style={{ color: 'rgb(255,0,142)' }}>
        {fileName.split('.').slice(0, -1).join('.')} - {settings.spotColorName} (Spotfarbe)
      </div>
    </>
  );
};
