
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
  // Using specific Adobe PostScript format required by Illustrator
  const cutContourStream = pdfContext.stream([
    '% Begin Cut Contour',        // Clear comment marker for debugging
    'q',                          // Save graphics state
    `/${spotColorName} CS`,       // Set stroke color space to spot color
    `/${spotColorName}GS gs`,     // Apply graphics state with exact name
    '0.1 w',                      // Set line width to exactly 0.1pt (important for RIPs)
    '1 0 0 1 0 0 cm',             // Identity matrix - no transformation
    '0 0 0 0 k',                  // Set fill color to none (CMYK 0,0,0,0)
    '0 1 0 0 K',                  // Set stroke color to 100% magenta (CMYK 0,1,0,0)
    `${pathData}`,                // Path data with stroke operator
    'Q',                          // Restore graphics state
    '% End Cut Contour'           // Clear end marker for debugging
  ].join('\n'));
  
  // Register the stream with the PDF context to get a reference
  const cutContourStreamRef = pdfContext.register(cutContourStream);
  
  // Add the content stream to the page at the END to ensure it's on top of all other content
  page.node.addContentStream(cutContourStreamRef);
  
  // Return the page for backward compatibility
  return page;
};
