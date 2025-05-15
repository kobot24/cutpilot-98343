
import { PDFPage, PDFContext } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 * @param spotColorName Name of the spot color to use
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string, spotColorName: string) => {
  // Create the content stream containing the cut contour
  // Using Adobe-specific PostScript format for maximum compatibility
  const cutContourStream = pdfContext.stream(`
% Begin Adobe Illustrator CutContour
q
/${spotColorName} CS
/${spotColorName}GS gs
0.1 w
1 0 0 1 0 0 cm
0 0 0 0 k
0 1 0 0 K
${pathData}
S
Q
% End Cut Contour
`);
  
  // Register the stream with the PDF context to get a reference
  const cutContourStreamRef = pdfContext.register(cutContourStream);
  
  // Add the content stream to the page at the END to ensure it's on top of all other content
  page.node.addContentStream(cutContourStreamRef);
  
  // Return the page for backward compatibility
  return page;
};
