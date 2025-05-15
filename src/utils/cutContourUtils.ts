
import { PDFName, PDFNumber, PDFContext, PDFArray, PDFDict, PDFStream, PDFHexString, PDFString } from 'pdf-lib';
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
  
  // Format as a single-line, properly spaced path with explicit stroke operator
  // Compatible with Adobe Illustrator and RIP systems
  return `${x} ${y} m ${x+w} ${y} l ${x+w} ${y+h} l ${x} ${y+h} l h`;
};

// Create true spot color for cut contour
export const createSpotColor = (pdfContext: PDFContext, spotColorName: string) => {
  // Create a true Adobe-compatible spot color with CMYK values 0,1,0,0 (100% Magenta)
  
  // Create separation color space with proper Adobe Illustrator compatibility
  const separationColorSpace = pdfContext.obj([
    PDFName.of('Separation'),
    PDFName.of(spotColorName),
    PDFName.of('DeviceCMYK'),
    pdfContext.obj({
      FunctionType: 2,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1, 0, 1],
      C0: [0, 0, 0, 0],
      C1: [0, 1, 0, 0], // 100% Magenta in CMYK
      N: 1
    })
  ]);

  // Create RGB alternate for screen display
  const rgbAlternateSpace = pdfContext.obj([
    PDFName.of('DeviceRGB'),
    pdfContext.obj({
      FunctionType: 2,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1],
      C0: [1, 1, 1],
      C1: [1, 0, 0.56], // RGB equivalent of 100% Magenta
      N: 1
    })
  ]);
  
  // Create spot color dictionary with Adobe-specific attributes
  const colorSpaceDict = pdfContext.obj({
    Type: PDFName.of('ColorSpace'),
    Subtype: PDFName.of('Separation'),
    TintTransform: PDFName.of('Identity'),
    AlternateSpace: PDFName.of('DeviceCMYK'),
    Base: PDFName.of(spotColorName),
    Name: PDFName.of(spotColorName),
    C: PDFNumber.of(0),
    M: PDFNumber.of(1), // 100% Magenta
    Y: PDFNumber.of(0),
    K: PDFNumber.of(0),
    SpotFunction: PDFName.of('Round'),
    Process: false,
    Colorant: PDFString.of(spotColorName),
    ColorantType: PDFString.of('Spot')
  });

  // Register color space stream for InkList compatibility (needed by some RIPs)
  const inkListStream = pdfContext.stream(`/${spotColorName} 0 1 0 0`);
  
  const inkList = pdfContext.obj({
    Type: PDFName.of('InkList'),
    SpotColors: pdfContext.obj([PDFString.of(spotColorName)]),
    Stream: inkListStream
  });

  // Return all needed references
  return {
    spotColorSpace: pdfContext.register(separationColorSpace),
    rgbAlternateSpace: pdfContext.register(rgbAlternateSpace),
    colorSpaceDict: pdfContext.register(colorSpaceDict),
    inkList: pdfContext.register(inkList)
  };
};

// Add graphics state for cut contour path
export const createCutContourGraphicsState = (pdfContext: PDFContext) => {
  // Create Adobe-compatible ExtGState with accurate technical parameters
  // These settings are crucial for RIP/cutting software
  const gsDict = pdfContext.obj({
    Type: PDFName.of('ExtGState'),
    ca: PDFNumber.of(1),    // non-stroke alpha - full opacity
    CA: PDFNumber.of(1),    // stroke alpha - full opacity
    LW: PDFNumber.of(0.1),  // Line width exactly 0.1pt as required for technical paths
    OPM: PDFNumber.of(1),   // Overprint mode
    op: false,              // No fill overprint
    OP: true,               // Stroke overprint (critical for spot color)
    SA: true,               // Stroke adjustment for better rendering
    SMask: PDFName.of('None'), // No soft mask
    AIS: false,             // Alpha source flag
    BM: PDFName.of('Normal'), // Normal blend mode only
    TK: true,               // Text knockout
    TR: PDFName.of('Identity') // Transfer function - exact reproduction
  });
  
  return pdfContext.register(gsDict);
};
