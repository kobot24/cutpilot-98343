
import { PDFPage, PDFContext } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string) => {
  // Get the current content stream
  const currentContentStream = page.getContentStream();
  
  // Create a new content stream with the cut contour path
  const cutContourStream = pdfContext.stream(`
q
/CutContour cs
/CutContourGS gs
1 0 0 0 setcmyk
${pathData}
S
Q
  `);
  
  // Add the new content stream to the page
  page.addContentStream(cutContourStream);
  
  return cutContourStream;
};
