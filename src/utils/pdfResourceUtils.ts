
import { PDFName, PDFContext, PDFPage } from 'pdf-lib';

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
  // Add named CutContour to content stream using standard PDF operators
  // Using stroke-only path with 100% magenta
  const contentStream = pdfContext.stream(`
    /CS1 CS
    /CS1 cs
    1 0 0 RG
    1 0 0 rg
    0.5 w
    /GS1 gs
    ${pathData} s
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
