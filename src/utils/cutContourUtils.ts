
import { PDFName, PDFNumber, PDFContext, PDFArray, PDFDict } from 'pdf-lib';
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
  // Using explicit moveTo, lineTo operators with line breaks for better compatibility
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
  // Create a true Adobe-compatible spot color with CMYK values 0,1,0,0 (100% Magenta)
  
  // Create tint transform function for CMYK conversion
  const tintTransform = pdfContext.obj({
    FunctionType: 2,
    Domain: [0, 1],
    Range: [0, 1, 0, 1, 0, 1, 0, 1],  // CMYK range
    C0: [0, 0, 0, 0],                 // CMYK min values 
    C1: [0, 1, 0, 0],                 // CMYK max values - 100% Magenta
    N: 1                              // Linear interpolation
  });

  // Create separation color space with explicit naming
  const separationColorSpace = pdfContext.obj([
    PDFName.of('Separation'),
    PDFName.of(spotColorName),         // Use exactly "CutContour" as spot color name
    PDFName.of('DeviceCMYK'),
    tintTransform
  ]);
  
  // Create spot color dictionary with explicit fields required by Adobe
  const colorSpaceDict = pdfContext.obj({
    ColorType: PDFName.of('Separation'),
    ColorSpace: PDFName.of('DeviceCMYK'),
    Name: PDFName.of(spotColorName),
    C: PDFNumber.of(0),
    M: PDFNumber.of(1),
    Y: PDFNumber.of(0),
    K: PDFNumber.of(0),
    Alternate: PDFName.of('DeviceCMYK')
  });

  return {
    spotColorSpace: pdfContext.register(separationColorSpace),
    colorSpaceDict: pdfContext.register(colorSpaceDict)
  };
};

// Add graphics state for cut contour path
export const createCutContourGraphicsState = (pdfContext: PDFContext) => {
  // Create Adobe-compatible ExtGState with overprint and stroke settings
  const gsDict = pdfContext.obj({
    Type: PDFName.of('ExtGState'),
    ca: PDFNumber.of(1),    // non-stroke alpha
    CA: PDFNumber.of(1),    // stroke alpha
    LW: PDFNumber.of(0.25), // Line width - 0.25pt for visible cut contours
    OPM: PDFNumber.of(1),   // Overprint mode
    op: true,              // Fill overprint (important for spot color)
    OP: true,              // Stroke overprint (important for spot color)
    SA: true,              // Stroke adjustment
    SMask: PDFName.of('None'),
    AIS: false,            // Alpha source flag
    BM: PDFName.of('Normal')
  });
  
  return pdfContext.register(gsDict);
};
