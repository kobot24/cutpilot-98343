
import { PDFPage, PDFContext, PDFName } from 'pdf-lib';

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
  
  // Set the graphics state with specific name for cut contour
  if (extGState) {
    (extGState as any).set(PDFName.of(`${spotColorName}GS`), gsRef);
  }
};
