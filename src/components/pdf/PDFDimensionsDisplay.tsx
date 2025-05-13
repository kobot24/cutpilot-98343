
import React from 'react';

type PDFDimensionsDisplayProps = {
  fileName: string;
  pdfDimensions: { width: number, height: number } | null;
};

export const PDFDimensionsDisplay = ({ fileName, pdfDimensions }: PDFDimensionsDisplayProps) => {
  // Extract dimensions, DPI and size from file name if available 
  // (format: filename_WxHcm_DPIdpi.pdf or filename_WxHmm_DPIdpi.pdf)
  const extractDimensionsFromFileName = () => {
    const dimensionsCmMatch = fileName.match(/(\d+\.?\d*)x(\d+\.?\d*)cm/);
    const dimensionsMmMatch = fileName.match(/(\d+\.?\d*)x(\d+\.?\d*)mm/);
    const dpiMatch = fileName.match(/(\d+)dpi/i);
    
    let dimensions = '';
    let sizeInMm = '';
    
    // Get dimensions either in cm or mm
    if (dimensionsCmMatch) {
      const width = parseFloat(dimensionsCmMatch[1]);
      const height = parseFloat(dimensionsCmMatch[2]);
      dimensions = `${width}×${height} cm`;
      sizeInMm = `${(width * 10).toFixed(0)}×${(height * 10).toFixed(0)} mm`;
    } else if (dimensionsMmMatch) {
      const width = parseFloat(dimensionsMmMatch[1]);
      const height = parseFloat(dimensionsMmMatch[2]);
      dimensions = `${width}×${height} mm`;
      sizeInMm = dimensions;
    } else if (pdfDimensions) {
      // Calculate from PDF dimensions if filename doesn't contain the information
      const widthCm = (pdfDimensions.width / 72 * 2.54).toFixed(1);
      const heightCm = (pdfDimensions.height / 72 * 2.54).toFixed(1);
      dimensions = `${widthCm}×${heightCm} cm`;
      sizeInMm = `${(parseFloat(widthCm) * 10).toFixed(0)}×${(parseFloat(heightCm) * 10).toFixed(0)} mm`;
    }
    
    const dpi = dpiMatch ? `${dpiMatch[1]} DPI` : '';
    
    return { dimensions, dpi, sizeInMm };
  };

  const { dimensions, dpi, sizeInMm } = extractDimensionsFromFileName();
  
  if (!dimensions) return null;
  
  return (
    <span className="text-sm font-normal text-gray-500 ml-2">
      {dimensions} {dpi && `(${dpi})`}{sizeInMm && dimensions.includes('cm') ? ` | ${sizeInMm}` : ''}
    </span>
  );
};
