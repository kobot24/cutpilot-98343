
import { PDFDocument, degrees } from 'pdf-lib';

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
  applyRotationToPage(tempPage, tempEmbeddedPdf[0], rotation, tempWidth, tempHeight);
  
  // Save and return the rotated PDF
  return await tempPdf.save();
};

/**
 * Applies the specified rotation to a PDF page
 * @param page The page to apply rotation to
 * @param embeddedPage The embedded page content
 * @param rotation The rotation angle in degrees
 * @param width The width in points
 * @param height The height in points
 */
const applyRotationToPage = (
  page: any, 
  embeddedPage: any, 
  rotation: number, 
  width: number, 
  height: number
) => {
  console.log(`PDF Rotation - Applying ${rotation}° rotation to page`);
  
  switch (rotation) {
    case 90:
      // For 90° rotation, we need to transform coordinates differently
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotate: degrees(90),
        xScale: 1,
        yScale: 1
      });
      break;
      
    case 180:
      page.drawPage(embeddedPage, {
        x: width, // Right edge
        y: height, // Top edge
        width: width,
        height: height,
        rotate: degrees(180),
        xScale: 1,
        yScale: 1
      });
      break;
      
    case 270:
      page.drawPage(embeddedPage, {
        x: width, // Right edge
        y: 0, // Bottom edge
        width: width,
        height: height,
        rotate: degrees(270),
        xScale: 1,
        yScale: 1
      });
      break;
      
    default:
      // For any non-standard rotation (shouldn't happen in our app, but just in case)
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotate: degrees(rotation)
      });
  }
};
