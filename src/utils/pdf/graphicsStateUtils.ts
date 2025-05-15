
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
    
    // Add Adobe-specific graphics states for optimal compatibility
    (extGState as PDFDict).set(PDFName.of('SpotState'), pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      SA: pdfContext.obj(true),
      SM: PDFNumber.of(0.02),
      OP: pdfContext.obj(true),
      op: pdfContext.obj(false),
      OPM: PDFNumber.of(1),
      LW: PDFNumber.of(0.1),    // Exact 0.1pt line width
      LC: PDFNumber.of(0),      // Butt cap
      LJ: PDFNumber.of(0),      // Miter join
      ML: PDFNumber.of(10),     // Miter limit
      D: pdfContext.obj([[PDFNumber.of(0)]]),  // Solid line
      BM: PDFName.of('Normal')  // Blend mode
    }));
    
    // Add spot color specific state
    (extGState as PDFDict).set(PDFName.of(`${spotColorName}_State`), pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      LW: PDFNumber.of(0.1),    // Line width
      OP: pdfContext.obj(true),     // Overprint stroke
      OPM: PDFNumber.of(1),     // Overprint mode
      SA: pdfContext.obj(true),     // Stroke adjustment
      BM: PDFName.of('Normal')  // Blend mode
    }));
  }
  
  // Add spot color to registered graphics states in a dedicated dict
  let spotGState = resources.get(PDFName.of('SpotStates'));
  if (!spotGState) {
    spotGState = pdfContext.obj({});
    resources.set(PDFName.of('SpotStates'), spotGState);
  }
  
  if (spotGState) {
    (spotGState as PDFDict).set(PDFName.of(spotColorName), gsRef);
  }
};
