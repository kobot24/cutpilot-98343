
import React from 'react';

type PDFDimensionsDisplayProps = {
  fileName: string;
  pdfDimensions: { width: number, height: number } | null;
};

export const PDFDimensionsDisplay = ({ fileName, pdfDimensions }: PDFDimensionsDisplayProps) => {
  // Extract dimensions and DPI from file name if available (format: filename_WxHcm_DPIdpi.pdf)
  const extractDimensionsFromFileName = () => {
    const dimensionsMatch = fileName.match(/(\d+\.?\d*)x(\d+\.?\d*)cm/);
    const dpiMatch = fileName.match(/(\d+)dpi/);
    
    const dimensions = dimensionsMatch ? `${dimensionsMatch[1]}×${dimensionsMatch[2]} cm` : '';
    const dpi = dpiMatch ? `${dpiMatch[1]} DPI` : '';
    
    if (dimensions && dpi) {
      return `${dimensions} (${dpi})`;
    } else if (dimensions) {
      return dimensions;
    } else if (pdfDimensions) {
      // Calculate from PDF dimensions if filename doesn't contain the information
      return `${(pdfDimensions.width / 72 * 2.54).toFixed(1)}×${(pdfDimensions.height / 72 * 2.54).toFixed(1)} cm`;
    }
    
    return '';
  };

  const dimensionsText = extractDimensionsFromFileName();
  
  if (!dimensionsText) return null;
  
  return (
    <span className="text-sm font-normal text-gray-500 ml-2">
      {dimensionsText}
    </span>
  );
};
