
import { PDFPage, PDFContext } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 * @param spotColorName Name of the spot color to use
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string, spotColorName: string) => {
  // Create a new content stream with the cut contour path
  // Using a raw stream approach for better TypeScript compatibility
  
  // Create the content stream containing the cut contour with proper PDF operators
  // Make sure to use the exact spot color name for all operators
  const cutContourStream = pdfContext.stream(`
q
/${spotColorName} cs
/${spotColorName} CS
/${spotColorName}GS gs
0 1 0 0 k
0 1 0 0 K
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
