
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
  // Using the exact format expected by Adobe Illustrator and RIP systems
  // Order of operators is critical for compatibility
  const cutContourStream = pdfContext.stream(`
q
/${spotColorName} CS          % Set stroke color space to spot color
/${spotColorName}GS gs        % Apply graphics state for proper line width and overprint
0.1 w                         % Set line width to exactly 0.1pt (standard for cut contours)
1 0 0 1 0 0 cm               % Identity matrix - no transformation
0 0 0 0 k                     % Set fill color to none (no fill)
0 1 0 0 K                     % Set stroke color to 100% magenta
${pathData}                   % Draw the path
S                             % Stroke path without filling
Q                             % Restore graphics state
  `.trim());
  
  // Register the stream with the PDF context to get a reference
  const cutContourStreamRef = pdfContext.register(cutContourStream);
  
  // Add the content stream to the page at the END to ensure it's on top of all other content
  page.node.addContentStream(cutContourStreamRef);
  
  // Return the page for backward compatibility
  return page;
};
