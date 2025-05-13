
import { PDFName, PDFNumber, PDFContext } from 'pdf-lib';
import { mmToPoints } from './dimensionUtils';

// Create a rectangular path with rounded corners using explicit PostScript operators
export const createCutContourPath = (width: number, height: number, offset: number): string => {
  // Convert mm to points using our conversion function
  const offsetPt = mmToPoints(offset);
  
  // Create a path that's INSET from the image edges by the offset
  // This creates a cutting path inside the image boundaries
  const x = offsetPt;
  const y = offsetPt;
  const w = width - (offsetPt * 2); // Narrower than the image
  const h = height - (offsetPt * 2); // Shorter than the image
  const r = 0; // No corner radius for precise cutting
  
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
  // Create a true spot color named "CutContour" with CMYK values 0,1,0,0 (100% Magenta)
  
  // Create a color space dictionary for the CutContour spot color
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
    PDFName.of(spotColorName),  // Actual spot color name
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
    LW: PDFNumber.of(0.1), // Line width - exactly 0.1pt for cut paths
    OPM: 1,               // Overprint mode
    OP: true,             // Overprint
    op: true              // Overprint for fill
  });
  
  return pdfContext.register(gsDict);
};
