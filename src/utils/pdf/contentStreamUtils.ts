
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
  // The "cs" operator sets the color space for non-stroking operations
  // The "k" operator sets the CMYK color for stroking operations (0,1,0,0 = 100% Magenta)
  // Use the exact spot color name for both color space and graphics state references
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
