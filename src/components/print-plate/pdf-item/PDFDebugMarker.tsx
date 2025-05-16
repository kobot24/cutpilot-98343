
import React from 'react';

type PDFDebugMarkerProps = {
  showDebug: boolean;
};

export const PDFDebugMarker = ({ showDebug }: PDFDebugMarkerProps) => {
  if (!showDebug) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-red-300 opacity-50"></div>
      <div className="absolute left-0 right-0 h-0.5 bg-red-300 opacity-50"></div>
    </div>
  );
};
