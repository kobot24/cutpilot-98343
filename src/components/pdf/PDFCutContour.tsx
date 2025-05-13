
import React from 'react';
import { useSettings } from '@/hooks/useSettings';

type PDFCutContourProps = {
  fileName: string;
  show: boolean;
};

export const PDFCutContour = ({ fileName, show }: PDFCutContourProps) => {
  const { settings } = useSettings();
  
  if (!show) return null;
  
  // Set inset percentage based on settings offset value (default 3mm)
  // We use percentage to maintain scale at different viewport sizes
  const offsetPercentage = `${settings.cutContourOffset}%`;
  
  return (
    <>
      {/* Magenta solid border with correct offset */}
      <div 
        className="absolute pointer-events-none border-2 border-[#D946EF] opacity-70"
        style={{ 
          inset: offsetPercentage,
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-[#D946EF] font-medium">
        {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
      </div>
    </>
  );
};
