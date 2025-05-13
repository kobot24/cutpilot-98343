
import React from 'react';

type PDFDimensionsDisplayProps = {
  fileName: string;
  pdfDimensions: { width: number, height: number } | null;
};

export const PDFDimensionsDisplay = ({ fileName, pdfDimensions }: PDFDimensionsDisplayProps) => {
  // Extract dimensions from file name if available (format: filename_WxHcm.pdf)
  const extractDimensionsFromFileName = () => {
    const match = fileName.match(/(\d+\.?\d*)x(\d+\.?\d*)cm/);
    if (match) {
      return `${match[1]}×${match[2]} cm`;
    }
    return pdfDimensions ? 
      `${(pdfDimensions.width / 72 * 2.54).toFixed(1)}×${(pdfDimensions.height / 72 * 2.54).toFixed(1)} cm` : 
      '';
  };

  const dimensionsText = extractDimensionsFromFileName();
  
  if (!dimensionsText) return null;
  
  return (
    <span className="text-sm font-normal text-gray-500 ml-2">
      {dimensionsText}
    </span>
  );
};
