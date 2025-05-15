
import { PDFPage, PDFContext, PDFName, PDFDict, PDFNumber } from 'pdf-lib';

/**
 * Add graphics state to page resources
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param gsRef Graphics state reference to add
 * @param spotColorName Name of the spot color for graphics state name
 */
export const addGraphicsStateToResources = (page: PDFPage, pdfContext: PDFContext, gsRef: any, spotColorName: string) => {
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
  
  // Use the exact spot color name with GS suffix for consistency
  if (extGState) {
    (extGState as PDFDict).set(PDFName.of(`${spotColorName}GS`), gsRef);
    
    // Add additional standard graphics states required for PDF/X compliance
    (extGState as PDFDict).set(PDFName.of('DefaultCMYK'), pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      BM: PDFName.of('Normal'),
      SA: true,
      SM: PDFNumber.of(0.02),
      OP: false,
      op: false,
      OPM: PDFNumber.of(1),
      TR: PDFName.of('Identity')
    }));
    
    // Add technical graphics state specifically for spot colors
    // Use dynamic name based on the spot color name instead of hardcoding
    (extGState as PDFDict).set(PDFName.of(`${spotColorName}State`), pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      LW: PDFNumber.of(0.1),    // Exact 0.1pt line width
      LC: PDFNumber.of(0),      // Butt cap
      LJ: PDFNumber.of(0),      // Miter join
      ML: PDFNumber.of(10),     // Miter limit
      D: pdfContext.obj([[PDFNumber.of(0)]]),  // Solid line
      RI: PDFName.of('AbsoluteColorimetric'),  // Rendering intent
      OP: true,                 // Overprint for stroke
      op: false                 // No overprint for fill
    }));
  }
};
