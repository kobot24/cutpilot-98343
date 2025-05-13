
import { PDFPage, PDFContext } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string) => {
  // Create a new content stream with the cut contour path
  // Using a raw stream approach for better TypeScript compatibility
  
  // Create the content stream containing the cut contour with proper PDF operators
  const cutContourStream = pdfContext.stream(`
q
/CutContour cs
/CutContourGS gs
0 1 0 0 k
${pathData}
S
Q
  `);
  
  // Add the content stream to the page using the PDFPage's content method
  page.node.addContentStream(cutContourStream.ref);
  
  // Return the page for backward compatibility
  return page;
};
