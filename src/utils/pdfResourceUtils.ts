
import { PDFName, PDFContext, PDFPage, PDFArray, PDFDict, PDFString } from 'pdf-lib';

// Add color space to page resources
export const addColorSpaceToResources = (page: PDFPage, pdfContext: PDFContext, spotColorRef: any) => {
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
  
  // Set the spot color in the ColorSpace dictionary
  if (colorSpaceDict) {
    (colorSpaceDict as any).set(PDFName.of('CS1'), spotColorRef);
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
  
  // Set the graphics state
  if (extGState) {
    (extGState as any).set(PDFName.of('GS1'), gsRef);
  }
};

// Add content stream with cut contour path to page
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string) => {
  // Create named CutContour layer as a Property List
  const layerDict = pdfContext.obj({
    Type: PDFName.of('OCG'),
    Name: PDFString.of('CutContour'),
    Intent: PDFName.of('Design'),
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
  // This format is specifically designed for Adobe Illustrator compatibility
  const contentStream = pdfContext.stream(`
    % CutContour Path
    /OC /oc${layerRef.objectNumber} BDC
    q
    /CS1 CS
    /CS1 cs
    1 0 0 RG
    1 0 0 rg
    0.5 w
    /GS1 gs
    ${pathData}
    S
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
