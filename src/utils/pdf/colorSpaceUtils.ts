
import { PDFPage, PDFContext, PDFName, PDFDict, PDFArray, PDFBool, PDFString } from 'pdf-lib';

/**
 * Add color space to page resources
 * @param page PDF page to modify
 * @param pdfContext PDF document context
 * @param spotColorData Spot color data containing color space and dictionary
 * @param spotColorName Name of the spot color
 */
export const addColorSpaceToResources = (page: PDFPage, pdfContext: PDFContext, spotColorData: any, spotColorName: string) => {
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
  
  // Set the spot color in the ColorSpace dictionary with exactly the spot color name
  if (colorSpaceDict) {
    (colorSpaceDict as PDFDict).set(PDFName.of(spotColorName), spotColorData.spotColorSpace);
    
    // Also add Adobe-specific name format for maximum compatibility
    (colorSpaceDict as PDFDict).set(PDFName.of('SPOT_' + spotColorName), spotColorData.spotColorSpace);
    (colorSpaceDict as PDFDict).set(PDFName.of('Separation_' + spotColorName), spotColorData.spotColorSpace);
  }
  
  // Add Properties dictionary for spot colors - critical for Adobe compatibility
  let propertiesDict = resources.get(PDFName.of('Properties'));
  if (!propertiesDict) {
    propertiesDict = pdfContext.obj({});
    resources.set(PDFName.of('Properties'), propertiesDict);
  }
  
  // Register the color space dictionary in Properties with exact name
  if (propertiesDict) {
    (propertiesDict as PDFDict).set(PDFName.of(spotColorName), spotColorData.colorSpaceDict);
    
    // Add separation info dict specifically for Adobe compatibility
    if (spotColorData.separationInfoDict) {
      (propertiesDict as PDFDict).set(PDFName.of('SpotInfo_' + spotColorName), spotColorData.separationInfoDict);
    }
  }
  
  // Add to ProcSet for older PDF processors
  let procSet = resources.get(PDFName.of('ProcSet'));
  if (!procSet) {
    procSet = pdfContext.obj([
      PDFName.of('PDF'),
      PDFName.of('Text'),
      PDFName.of('ImageB'),
      PDFName.of('ImageC'),
      PDFName.of('ImageI')
    ]);
    resources.set(PDFName.of('ProcSet'), procSet);
  }
  
  // Add explicit Adobe-specific color usage marker
  resources.set(PDFName.of('ColorUsage'), pdfContext.obj({
    SpotColor: PDFBool.of(true),
    UsesSpotColor: PDFBool.of(true),
    SpotNames: pdfContext.obj([PDFString.of(spotColorName)])
  }));
};
