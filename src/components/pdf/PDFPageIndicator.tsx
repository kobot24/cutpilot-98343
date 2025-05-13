
import React from 'react';

type PDFPageIndicatorProps = {
  pageNumber: number;
  numPages: number | null;
};

export const PDFPageIndicator = ({ pageNumber, numPages }: PDFPageIndicatorProps) => {
  if (!numPages || numPages <= 1) return null;
  
  return (
    <div className="absolute bottom-2 left-2 bg-white/80 text-xs px-2 py-1 rounded">
      Seite {pageNumber} von {numPages}
    </div>
  );
};
