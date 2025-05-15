
import { PDFPage, PDFName, PDFDict, PDFContext, PDFString } from 'pdf-lib';

// Add color space to page resources
export const addColorSpaceToResources = (page: PDFPage, pdfContext: PDFContext, spotColorData: any) => {
  // Add resources to the page
  const resources = page.node.Resources();
  if (!resources) {
    throw new Error('Could not access page resources');
  }
  
  // Get or create ColorSpace dictionary
  let colorSpaceDict = resources.get(PDFName.of('ColorSpace'));
  if (!colorSpaceDict) {
    colorSpaceDict = pdfContext.obj({});
    resources.set(PDFName.of('ColorSpace'), colorSpaceDict);
  }
  
  // Set the spot color in the ColorSpace dictionary with proper name
  if (colorSpaceDict) {
    (colorSpaceDict as any).set(PDFName.of('CutContour'), spotColorData.spotColorSpace);
  }
  
  // Add Properties dictionary for Illustrator spot colors
  let propertiesDict = resources.get(PDFName.of('Properties'));
  if (!propertiesDict) {
    propertiesDict = pdfContext.obj({});
    resources.set(PDFName.of('Properties'), propertiesDict);
  }
  
  // Register the color space dictionary in Properties for Illustrator compatibility
  if (propertiesDict) {
    (propertiesDict as any).set(PDFName.of('CutContour'), spotColorData.colorSpaceDict);
  }
};

// Add graphics state to page resources
export const addGraphicsStateToResources = (page: PDFPage, pdfContext: PDFContext, gsRef: any) => {
  // Get or create ExtGState dictionary
  const resources = page.node.Resources();
  if (!resources) {
    throw new Error('Could not access page resources');
  }
  
  let extGState = resources.get(PDFName.of('ExtGState'));
  if (!extGState) {
    extGState = pdfContext.obj({});
    resources.set(PDFName.of('ExtGState'), extGState);
  }
  
  // Set the graphics state with specific name for cut contour
  if (extGState) {
    (extGState as any).set(PDFName.of('CutContourGS'), gsRef);
  }
};

// Add content stream with cut contour path to page
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string) => {
  // Create named CutContour layer as a Property List for Adobe compatibility
  const layerDict = pdfContext.obj({
    Type: PDFName.of('OCG'),
    Name: PDFString.of('CutContour'),
    Intent: pdfContext.obj([PDFName.of('View'), PDFName.of('Design'), PDFName.of('PrintShape')]),
    Usage: pdfContext.obj({
      CreatorInfo: pdfContext.obj({
        Creator: PDFString.of('Adobe Illustrator'),
        Subtype: PDFName.of('Artwork')
      }),
      PrintState: PDFName.of('ON'),
      ViewState: PDFName.of('ON')
    })
  });
  
  // Register the layer and add to catalog
  const layerRef = pdfContext.register(layerDict);
  
  // Get catalog and add OCProperties if needed
  const catalog = page.doc.catalog;
  let ocProperties = catalog.get(PDFName.of('OCProperties'));
  if (!ocProperties) {
    ocProperties = pdfContext.obj({
      OCGs: pdfContext.obj([layerRef]),
      D: pdfContext.obj({
        Order: pdfContext.obj([layerRef]),
        ON: pdfContext.obj([layerRef])
      })
    });
    catalog.set(PDFName.of('OCProperties'), ocProperties);
  }
  
  // Format content stream with CutContour name and proper PostScript structure
  // Using explicit spot color operators for Adobe compatibility
  const contentStream = pdfContext.stream(`
    % CutContour Path - Adobe Illustrator Compatible Spot Color
    /OC /CutContour BDC
    q
    /CutContour CS       % Set CutContour as the stroke color space
    /CutContour cs       % Set CutContour as the fill color space
    1 scn               % Set tint value to 100%
    1 SCN               % Set stroke tint value to 100%
    /CutContourGS gs    % Apply graphics state with 0.1pt line width
    ${pathData}
    S                   % Stroke the path
    Q
    EMC
  `);
  
  // Get current content streams
  const currentContents = page.node.Contents();
  let contentArray;
  
  if (currentContents instanceof PDFArray) {
    contentArray = currentContents;
  } else {
    contentArray = pdfContext.obj([]);
    if (currentContents) {
      contentArray.push(currentContents);
    }
  }
  
  // Add new content stream with the CutContour path
  const contentStreamRef = pdfContext.register(contentStream);
  contentArray.push(contentStreamRef);
  page.node.set(PDFName.of('Contents'), contentArray);
};
