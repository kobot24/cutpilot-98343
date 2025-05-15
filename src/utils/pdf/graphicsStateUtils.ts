
import { PDFPage, PDFContext, PDFName, PDFDict } from 'pdf-lib';

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
  }
};
