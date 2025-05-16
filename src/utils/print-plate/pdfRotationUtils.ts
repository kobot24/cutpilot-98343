
import { PDFDocument, degrees } from 'pdf-lib';
import { getRotatedTransform } from './pdfTransformUtils';

/**
 * Creates a temporary PDF with rotated content
 * @param pdfBytes The original PDF bytes
 * @param rotation The rotation angle in degrees
 * @param itemWidth Width of the item in points
 * @param itemHeight Height of the item in points
 * @returns The rotated PDF bytes
 */
export const createRotatedPDF = async (
  pdfBytes: Uint8Array,
  rotation: number,
  itemWidth: number,
  itemHeight: number
): Promise<Uint8Array> => {
  console.log(`PDF Rotation - Creating rotated PDF for ${rotation}° rotation`);
  console.log(`PDF Rotation - Original dimensions: width=${itemWidth}, height=${itemHeight}`);
  
  // If no rotation, return original PDF
  if (rotation === 0) {
    console.log(`PDF Rotation - No rotation needed, returning original PDF`);
    return pdfBytes;
  }
  
  // Create a temporary PDF that will hold our rotated content
  const tempPdf = await PDFDocument.create();
  
  // Determine dimensions for temporary PDF based on rotation angle
  let tempWidth = itemWidth;
  let tempHeight = itemHeight;
  
  // For 90° and 270° rotations, we need to swap width and height
  if (rotation === 90 || rotation === 270) {
    console.log(`PDF Rotation - Swapping dimensions for ${rotation}° rotation`);
    tempWidth = itemHeight;
    tempHeight = itemWidth;
  }
  
  // Add a page to our temporary PDF with the appropriate dimensions
  const tempPage = tempPdf.addPage([tempWidth, tempHeight]);
  
  // Embed original PDF into our temporary document
  const tempEmbeddedPdf = await tempPdf.embedPdf(pdfBytes);
  if (tempEmbeddedPdf.length === 0) {
    throw new Error("Failed to embed PDF into temporary document");
  }
  
  // Apply rotation based on angle
  applyRotationToPage(tempPage, tempEmbeddedPdf[0], rotation, tempWidth, tempHeight, itemWidth, itemHeight);
  
  // Save and return the rotated PDF
  return await tempPdf.save();
};

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
const applyRotationToPage = (
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
  
  // Calculate center point
  const centerX = width / 2;
  const centerY = height / 2;
  console.log(`PDF Rotation - Page center: (${centerX}, ${centerY})`);
  
  // For PDF coordinates, origin (0,0) is at the bottom left
  // For center-preserving rotation, we'll calculate based on the center of the page
  let transform;
  let drawWidth, drawHeight;
  
  // The important change: only rotate the content, not the cut contour bounds
  switch (rotation) {
    case 90:
      // For 90° rotation
      drawWidth = originalHeight;
      drawHeight = originalWidth;
      // Draw at center, rotated 90°
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight, 
        rotate: degrees(90),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 180:
      // For 180° rotation
      drawWidth = originalWidth;
      drawHeight = originalHeight;
      // Draw at center, rotated 180°
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(180),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    case 270:
      // For 270° rotation
      drawWidth = originalHeight;
      drawHeight = originalWidth;
      // Draw at center, rotated 270°
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(270),
        xSkew: degrees(0),
        ySkew: degrees(0)
      });
      break;
      
    default:
      // 0° (no rotation)
      drawWidth = originalWidth;
      drawHeight = originalHeight;
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight
      });
      break;
  }
  
  console.log(`PDF Rotation - Applied rotation with dimensions: w=${drawWidth}, h=${drawHeight}`);
};
