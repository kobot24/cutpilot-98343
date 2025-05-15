
import { PDFName, PDFNumber, PDFContext, PDFArray, PDFDict, PDFStream, PDFHexString, PDFString, PDFBool } from 'pdf-lib';
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
  
  // Format as explicit PostScript path commands with proper spacing
  // This specific format is required by Adobe Illustrator to recognize as a path
  return `${x} ${y} m ${x+w} ${y} l ${x+w} ${y+h} l ${x} ${y+h} l ${x} ${y} l`;
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
      FunctionType: PDFNumber.of(2),
      Domain: [PDFNumber.of(0), PDFNumber.of(1)],
      Range: [
        PDFNumber.of(0), PDFNumber.of(1), 
        PDFNumber.of(0), PDFNumber.of(1), 
        PDFNumber.of(0), PDFNumber.of(1), 
        PDFNumber.of(0), PDFNumber.of(1)
      ],
      C0: [PDFNumber.of(0), PDFNumber.of(0), PDFNumber.of(0), PDFNumber.of(0)],
      C1: [PDFNumber.of(0), PDFNumber.of(1), PDFNumber.of(0), PDFNumber.of(0)], // 100% Magenta in CMYK
      N: PDFNumber.of(1)
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
    Process: new PDFBool(false),
    Colorant: PDFString.of(spotColorName),
    ColorantName: PDFString.of(spotColorName)
  });

  // Create specialized SeparationInfo dict for Adobe compatibility
  const separationInfoDict = pdfContext.obj({
    SeparationColorName: PDFString.of(spotColorName),
    SeparationType: PDFString.of('Spot'),
    SeparationOrder: 1,
    ProcessColorModel: PDFName.of('DeviceCMYK'),
    Components: pdfContext.obj([
      PDFNumber.of(0), // C
      PDFNumber.of(1), // M
      PDFNumber.of(0), // Y
      PDFNumber.of(0)  // K
    ]),
    IsSpot: new PDFBool(true)
  });

  // Return all needed references
  return {
    spotColorSpace: pdfContext.register(separationColorSpace),
    colorSpaceDict: pdfContext.register(colorSpaceDict),
    separationInfoDict: pdfContext.register(separationInfoDict)
  };
};

// Add graphics state for cut contour path
export const createCutContourGraphicsState = (pdfContext: PDFContext, spotColorName: string) => {
  // Create Adobe-compatible ExtGState with accurate technical parameters
  const gsDict = pdfContext.obj({
    Type: PDFName.of('ExtGState'),
    ca: PDFNumber.of(1),    // non-stroke alpha
    CA: PDFNumber.of(1),    // stroke alpha
    LW: PDFNumber.of(0.1),  // Line width
    OPM: PDFNumber.of(1),   // Overprint mode
    op: new PDFBool(false),  // No fill overprint
    OP: new PDFBool(true),   // Stroke overprint
    SA: new PDFBool(true),   // Stroke adjustment
    SMask: PDFName.of('None'), // No soft mask
    BM: PDFName.of('Normal'), // Normal blend mode
    TK: new PDFBool(true),   // Text knockout
    TR: PDFName.of('Identity') // Transfer function
  });
  
  return pdfContext.register(gsDict);
};
