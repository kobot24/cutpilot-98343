
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
  // This matches exactly what Adobe Illustrator shows for CMYK (0,100,0,0)
  return (
    <>
      {/* Magenta solid border exactly matching Illustrator display */}
      <div 
        className="absolute pointer-events-none"
        style={{ 
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: '1px solid rgb(236,0,140)', // RGB equivalent of 100% Magenta that Illustrator shows
          opacity: 1,
          boxSizing: 'border-box'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded font-medium"
           style={{ color: 'rgb(236,0,140)' }}>
        {fileName.split('.').slice(0, -1).join('.')} - {settings.spotColorName} (Spot Color)
      </div>
    </>
  );
};
