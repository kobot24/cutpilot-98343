
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
  applyRotationToPage(tempPage, tempEmbeddedPdf[0], rotation, tempWidth, tempHeight, itemWidth, itemHeight);
  
  // Save and return the rotated PDF
  return await tempPdf.save();
};

/**
 * Applies the specified rotation to a PDF page
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
  
  switch (rotation) {
    case 90:
      // For 90° rotation, draw from bottom left, rotate around that point
      // Note: The coordinate system starts from bottom-left in PDF
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: height,  // swapped dimensions
        height: width,  // swapped dimensions
        rotate: degrees(90),
        xScale: 1,
        yScale: 1
      });
      console.log(`PDF Rotation - 90° rotation applied with dimensions w:${height} h:${width}`);
      break;
      
    case 180:
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotate: degrees(180),
        xScale: 1,
        yScale: 1
      });
      break;
      
    case 270:
      page.drawPage(embeddedPage, {
        x: height, // Move to right edge for 270° rotation
        y: 0,
        width: height,  // swapped dimensions
        height: width,  // swapped dimensions
        rotate: degrees(270),
        xScale: 1,
        yScale: 1
      });
      break;
      
    default:
      // For 0° or any non-standard rotation
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotate: degrees(rotation)
      });
  }
};
