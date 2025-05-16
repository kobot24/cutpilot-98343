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
  
  // Calculate center point of the target area
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Apply rotation and transformation based on rotation angle
  switch (rotation) {
    case 90: {
      // For 90° rotation, width and height are swapped
      const rotatedWidth = originalHeight;
      const rotatedHeight = originalWidth;
      
      // Calculate position to maintain center point
      const correctedX = centerX - rotatedWidth / 2;
      const correctedY = centerY - rotatedHeight / 2;
      
      console.log(`PDF Rotation - 90° rotation with center at (${centerX}, ${centerY})`);
      console.log(`PDF Rotation - Corrected position: (${correctedX}, ${correctedY})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX,
        y: correctedY,
        width: rotatedWidth,
        height: rotatedHeight,
        rotate: degrees(90),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
    }
      
    case 180: {
      // For 180° rotation, dimensions remain the same
      const rotatedWidth = originalWidth;
      const rotatedHeight = originalHeight;
      
      // Calculate position to maintain center point
      const correctedX = centerX - rotatedWidth / 2;
      const correctedY = centerY - rotatedHeight / 2;
      
      console.log(`PDF Rotation - 180° rotation with center at (${centerX}, ${centerY})`);
      console.log(`PDF Rotation - Corrected position: (${correctedX}, ${correctedY})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX,
        y: correctedY,
        width: rotatedWidth,
        height: rotatedHeight,
        rotate: degrees(180),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
    }
      
    case 270: {
      // For 270° rotation, width and height are swapped
      const rotatedWidth = originalHeight;
      const rotatedHeight = originalWidth;
      
      // Calculate position to maintain center point
      const correctedX = centerX - rotatedWidth / 2;
      const correctedY = centerY - rotatedHeight / 2;
      
      console.log(`PDF Rotation - 270° rotation with center at (${centerX}, ${centerY})`);
      console.log(`PDF Rotation - Corrected position: (${correctedX}, ${correctedY})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX,
        y: correctedY,
        width: rotatedWidth,
        height: rotatedHeight,
        rotate: degrees(270),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
    }
      
    default: {
      // No rotation (0°)
      const rotatedWidth = originalWidth;
      const rotatedHeight = originalHeight;
      
      // Calculate position to maintain center point
      const correctedX = centerX - rotatedWidth / 2;
      const correctedY = centerY - rotatedHeight / 2;
      
      console.log(`PDF Rotation - No rotation (0°), center at (${centerX}, ${centerY})`);
      console.log(`PDF Rotation - Corrected position: (${correctedX}, ${correctedY})`);
      
      page.drawPage(embeddedPage, {
        x: correctedX,
        y: correctedY,
        width: rotatedWidth,
        height: rotatedHeight
      });
      break;
    }
  }
  
  console.log(`PDF Rotation - Applied ${rotation}° rotation successfully`);
};
