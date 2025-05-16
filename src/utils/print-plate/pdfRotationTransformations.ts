
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
  
  // Calculate center point for consistent placement
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Apply rotation and transformation based on rotation angle
  switch (rotation) {
    case 90:
      // 90° clockwise with center-preserving position
      // For 90° rotation, we swap width and height
      // Calculate the corrected position to maintain center point
      const correctedX90 = centerX - originalHeight / 2;
      const correctedY90 = centerY - originalWidth / 2;
      
      console.log(`PDF Rotation - Center-preserving position for 90°: (${correctedX90}, ${correctedY90})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX90,
        y: correctedY90,
        width: originalHeight,
        height: originalWidth,
        rotate: degrees(90),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 180:
      // 180° rotation with center-preserving position
      const correctedX180 = centerX - originalWidth / 2;
      const correctedY180 = centerY - originalHeight / 2;
      
      console.log(`PDF Rotation - Center-preserving position for 180°: (${correctedX180}, ${correctedY180})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX180,
        y: correctedY180,
        width: originalWidth,
        height: originalHeight,
        rotate: degrees(180),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 270:
      // 270° rotation with center-preserving position
      // For 270° rotation, we swap width and height
      const correctedX270 = centerX - originalHeight / 2;
      const correctedY270 = centerY - originalWidth / 2;
      
      console.log(`PDF Rotation - Center-preserving position for 270°: (${correctedX270}, ${correctedY270})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX270,
        y: correctedY270,
        width: originalHeight,
        height: originalWidth,
        rotate: degrees(270),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    default:
      // No rotation (0°) with center-preserving position
      const correctedX0 = centerX - originalWidth / 2;
      const correctedY0 = centerY - originalHeight / 2;
      
      console.log(`PDF Rotation - Center-preserving position for 0°: (${correctedX0}, ${correctedY0})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX0,
        y: correctedY0,
        width: originalWidth,
        height: originalHeight
      });
      break;
  }
  
  console.log(`PDF Rotation - Applied ${rotation}° rotation successfully`);
};

