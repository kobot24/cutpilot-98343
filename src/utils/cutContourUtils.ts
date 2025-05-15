
import { PDFName, PDFNumber, PDFContext } from 'pdf-lib';
import { mmToPoints } from './dimensionUtils';

// Create a rectangular path with rounded corners using explicit PostScript operators
export const createCutContourPath = (width: number, height: number, offset: number): string => {
  // Convert offset from mm to points for proper positioning
  const offsetPoints = mmToPoints(offset);
  
  // Apply offset to create a path with the specified margin
  const x = offsetPoints;
  const y = offsetPoints;
  const w = width - (offsetPoints * 2);
  const h = height - (offsetPoints * 2);
  
  // Format with proper PostScript path operators and spacing
  // Using explicit moveTo, lineTo operators with line breaks
  return `
    ${x} ${y} m
    ${x+w} ${y} l
    ${x+w} ${y+h} l
    ${x} ${y+h} l
    ${x} ${y} l
    h
  `.trim().replace(/\n\s+/g, '\n    ');
};

// Create true spot color for cut contour
export const createSpotColor = (pdfContext: PDFContext, spotColorName: string) => {
  // Create a true spot color with CMYK values 0,1,0,0 (100% Magenta)
  
  // Create a color space dictionary for the spot color
  const colorSpaceDict = pdfContext.obj({
    ColorSpace: PDFName.of('DeviceCMYK'),
    C: 0,
    M: 1,
    Y: 0,
    K: 0,
    Name: PDFName.of(spotColorName)
  });

  // Create true separation color space that Adobe recognizes as a spot color
  const separationColorSpace = pdfContext.obj([
    PDFName.of('Separation'),
    PDFName.of(spotColorName),  // Use the actual spot color name from settings
    PDFName.of('DeviceCMYK'),
    // Define tint transform function
    pdfContext.obj({
      FunctionType: 2,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1, 0, 1],  // CMYK range
      C0: [0, 0, 0, 0],                 // CMYK min values 
      C1: [0, 1, 0, 0],                 // CMYK max values - 100% Magenta
      N: 1                              // Linear interpolation
    })
  ]);
  
  return {
    spotColorSpace: pdfContext.register(separationColorSpace),
    colorSpaceDict: pdfContext.register(colorSpaceDict)
  };
};

// Add graphics state for cut contour path
export const createCutContourGraphicsState = (pdfContext: PDFContext) => {
  // Add ExtGState with standard print settings
  const gsDict = pdfContext.obj({
    Type: PDFName.of('ExtGState'),
    ca: PDFNumber.of(1),  // non-stroke alpha
    CA: PDFNumber.of(1),  // stroke alpha
    LW: PDFNumber.of(0.5), // Line width - 0.5pt for better visibility
    OPM: 1,               // Overprint mode
    OP: true,             // Overprint
    op: true              // Overprint for fill
  });
  
  return pdfContext.register(gsDict);
};
