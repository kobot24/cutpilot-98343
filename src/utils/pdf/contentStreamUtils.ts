
import { PDFPage, PDFContext } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 * @param spotColorName Name of the spot color to use
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string, spotColorName: string) => {
  // Create the content stream containing the cut contour with explicit Adobe-compatible operators
  // Using explicit operators with proper naming is critical for RIP systems
  const cutContourStream = pdfContext.stream(`
q
/${spotColorName} cs
/${spotColorName} CS
/${spotColorName}GS gs
1 0 0 1 0 0 cm
0 1 0 0 k
0 1 0 0 K
w
${pathData}
S
Q
  `);
  
  // Register the stream with the PDF context to get a reference
  const cutContourStreamRef = pdfContext.register(cutContourStream);
  
  // Add the content stream to the page using the registered reference
  page.node.addContentStream(cutContourStreamRef);
  
  // Return the page for backward compatibility
  return page;
};
