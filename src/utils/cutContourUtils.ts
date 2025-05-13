
import { PDFName, PDFNumber, PDFContext } from 'pdf-lib';

// Create a rectangular path with rounded corners using explicit PostScript operators
export const createCutContourPath = (width: number, height: number, offset: number): string => {
  // Convert mm to points (72 dpi)
  const offsetPt = offset * 2.83; 
  const x = offsetPt;
  const y = offsetPt;
  const w = width - (offsetPt * 2);
  const h = height - (offsetPt * 2);
  const r = 10; // Corner radius
  
  // Format with proper PostScript path operators and spacing
  // Using explicit moveTo, lineTo, curveTo operators with line breaks
  return `
    ${x+r} ${y} m
    ${x+w-r} ${y} l
    ${x+w} ${y} ${x+w} ${y} ${x+w} ${y+r} c
    ${x+w} ${y+h-r} l
    ${x+w} ${y+h} ${x+w} ${y+h} ${x+w-r} ${y+h} c
    ${x+r} ${y+h} l
    ${x} ${y+h} ${x} ${y+h} ${x} ${y+h-r} c
    ${x} ${y+r} l
    ${x} ${y} ${x} ${y} ${x+r} ${y} c
    h
  `.trim().replace(/\n\s+/g, '\n    ');
};

// Create spot color for cut contour
export const createSpotColor = (pdfContext: PDFContext, spotColorName: string) => {
  // Create a spot color specifically for CutContour with 100% Magenta
  
  // Create a PDF/X-compatible separation color space for CutContour
  // Use 100% Magenta as the spot color (0,1,0,0 in CMYK)
  const spotColorDict = pdfContext.obj({
    FunctionType: 2,
    Domain: [0, 1],
    Range: [0, 1, 0, 1, 0, 1, 0, 1], // CMYK
    C0: [0, 0, 0, 0], // CMYK Black
    C1: [0, 1, 0, 0], // 100% Magenta in CMYK
    N: 1, // Linear interpolation
  });
  
  // Create separation color space following PDF/X standards
  const spotColorSpace = pdfContext.obj([
    PDFName.of('Separation'),
    PDFName.of(spotColorName),
    PDFName.of('DeviceCMYK'),
    spotColorDict,
  ]);
  
  // Register the color space
  return pdfContext.register(spotColorSpace);
};

// Add graphics state for cut contour path
export const createCutContourGraphicsState = (pdfContext: PDFContext) => {
  // Add ExtGState with standard print settings
  const gsDict = pdfContext.obj({
    Type: PDFName.of('ExtGState'),
    ca: PDFNumber.of(1),  // non-stroke alpha
    CA: PDFNumber.of(1),  // stroke alpha
    LW: PDFNumber.of(0.1), // Line width - 0.1pt for cut paths
  });
  
  return pdfContext.register(gsDict);
};
