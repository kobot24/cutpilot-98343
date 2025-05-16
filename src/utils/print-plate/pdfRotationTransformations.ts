
import { degrees } from 'pdf-lib';

/**
 * Applies the specified rotation to a PDF page using the correct transformation matrix
 * @param page The page to apply rotation to
 * @param embeddedPage The embedded page content
 * @param rotation The rotation angle in degrees
 * @param width The width in points (of the target page)
 * @param height The height in points (of the target page)
 * @param originalWidth The original width in points (of the source content)
 * @param originalHeight The original height in points (of the source content)
 */
export const applyRotationToPage = (
  page: any, 
  embeddedPage: any, 
  rotation: number, 
  width: number, 
  height: number,
  originalWidth: number,
  originalHeight: number
) => {
  console.log(`PDF Rotation - Applying ${rotation}° rotation to page`);
  console.log(`PDF Rotation - Target dimensions: w=${width}, h=${height}`);
  console.log(`PDF Rotation - Original dimensions: w=${originalWidth}, h=${originalHeight}`);
  
  // Apply rotation and transformation based on rotation angle
  switch (rotation) {
    case 90:
      // 90° clockwise - use consistent approach with the main PDF processing
      page.drawPage(embeddedPage, {
        x: 0,
        y: originalWidth, // Shift by original width to maintain position
        width: height,
        height: width,
        rotate: degrees(90),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 180:
      // 180° im Uhrzeigersinn
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: originalWidth,
        height: originalHeight,
        rotate: degrees(180),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 270:
      // 270° im Uhrzeigersinn - korrigierte Implementierung
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotate: degrees(270),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    default:
      // Keine Rotation (0°)
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: originalWidth,
        height: originalHeight
      });
      break;
  }
  
  console.log(`PDF Rotation - Applied ${rotation}° rotation successfully`);
};
