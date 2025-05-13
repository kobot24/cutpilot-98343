
import { PDFPage, PDFContext, PDFOperator } from 'pdf-lib';

/**
 * Add cut contour path to PDF page
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param pathData Path data for the cut contour
 */
export const addCutContourToPage = (page: PDFPage, pdfContext: PDFContext, pathData: string) => {
  // Create a new content stream with the cut contour path
  // We'll use pushOperators to add our path data directly to the page's content stream
  
  // Create the sequence of PDF operators for the cut contour
  const operators = [
    // Save graphics state
    PDFOperator.of('q'),
    
    // Set the color space to our spot color
    PDFOperator.of('cs', 'CutContour'),
    
    // Set the graphics state for cut contour
    PDFOperator.of('gs', 'CutContourGS'),
    
    // Set CMYK color (100% magenta for visibility)
    PDFOperator.of('k', 0, 1, 0, 0),
    
    // Add the path data as raw operators
    ...pathData.split('\n').filter(line => line.trim()).map(line => {
      // Each line in pathData contains operators like "x y m" or "x y l"
      // We need to convert them to proper PDFOperators
      const parts = line.trim().split(' ');
      if (parts.length >= 3) {
        const operator = parts[parts.length - 1];
        const operands = parts.slice(0, parts.length - 1).map(Number);
        return PDFOperator.of(operator, ...operands);
      }
      return null;
    }).filter(op => op !== null),
    
    // Stroke the path
    PDFOperator.of('S'),
    
    // Restore graphics state
    PDFOperator.of('Q')
  ];
  
  // Add the operators to the page's content stream
  page.pushOperators(...operators);
  
  // Return the stream reference for backward compatibility
  return page;
};
