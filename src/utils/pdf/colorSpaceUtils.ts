
import { PDFPage, PDFContext, PDFName, PDFDict } from 'pdf-lib';

/**
 * Add color space to page resources
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param spotColorData Spot color data containing color space and dictionary
 */
export const addColorSpaceToResources = (page: PDFPage, pdfContext: PDFContext, spotColorData: any) => {
  // Add resources to the page
  const resources = page.node.Resources();
  if (!resources) {
    throw new Error('Could not access page resources');
  }
  
  // Get or create ColorSpace dictionary
  let colorSpaceDict = resources.get(PDFName.of('ColorSpace'));
  if (!colorSpaceDict) {
    colorSpaceDict = pdfContext.obj({});
    resources.set(PDFName.of('ColorSpace'), colorSpaceDict);
  }
  
  // Set the spot color in the ColorSpace dictionary with proper name
  if (colorSpaceDict) {
    (colorSpaceDict as any).set(PDFName.of('CutContour'), spotColorData.spotColorSpace);
  }
  
  // Add Properties dictionary for Illustrator spot colors
  let propertiesDict = resources.get(PDFName.of('Properties'));
  if (!propertiesDict) {
    propertiesDict = pdfContext.obj({});
    resources.set(PDFName.of('Properties'), propertiesDict);
  }
  
  // Register the color space dictionary in Properties for Illustrator compatibility
  if (propertiesDict) {
    (propertiesDict as any).set(PDFName.of('CutContour'), spotColorData.colorSpaceDict);
  }
};
