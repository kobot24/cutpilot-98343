
import { PDFDocument } from 'pdf-lib';
import { applyRotationToPage } from './pdfRotationTransformations';

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
  applyRotationToPage(
    tempPage, 
    tempEmbeddedPdf[0], 
    rotation, 
    tempWidth, 
    tempHeight, 
    itemWidth, 
    itemHeight
  );
  
  // Save and return the rotated PDF
  return await tempPdf.save();
};
