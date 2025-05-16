import { PDFDocument, degrees, PDFPage } from 'pdf-lib';
import { getRotatedTransform } from './pdfTransformUtils';

/**
 * Determines if a file is a PDF based on URL or data
 * @param fileUrlOrData The file URL or binary data
 * @returns Boolean indicating if the file is a PDF
 */
export const isPDF = (fileUrlOrData: string | Uint8Array): boolean => {
  if (typeof fileUrlOrData === 'string') {
    // Check if URL ends with .pdf (case insensitive)
    return /\.pdf$/i.test(fileUrlOrData);
  } else {
    // For binary data, check PDF signature (%PDF-)
    const header = fileUrlOrData.slice(0, 5);
    const signature = new TextDecoder().decode(header);
    return signature.startsWith('%PDF-');
  }
};

/**
 * Creates a temporary PDF with rotated content
 * @param pdfBytes The original PDF or image bytes
 * @param rotation The rotation angle in degrees
 * @param itemWidth Width of the item in points
 * @param itemHeight Height of the item in points
 * @param isImageSource Whether the source is an image rather than a PDF
 * @returns The rotated PDF bytes
 */
export const createRotatedPDF = async (
  pdfBytes: Uint8Array,
  rotation: number,
  itemWidth: number,
  itemHeight: number,
  isImageSource: boolean = false
): Promise<Uint8Array> => {
  console.log(`PDF Rotation - Creating rotated PDF for ${rotation}° rotation`);
  console.log(`PDF Rotation - Original dimensions: width=${itemWidth}, height=${itemHeight}`);
  console.log(`PDF Rotation - Source is ${isImageSource ? 'image' : 'PDF'}`);
  
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
  
  if (isImageSource) {
    // For images, we need to embed the image and apply rotation directly
    await applyImageRotation(tempPdf, tempPage, pdfBytes, rotation, tempWidth, tempHeight, itemWidth, itemHeight);
  } else {
    // For PDFs, embed the PDF and apply the rotation
    const tempEmbeddedPdf = await tempPdf.embedPdf(pdfBytes);
    if (tempEmbeddedPdf.length === 0) {
      throw new Error("Failed to embed PDF into temporary document");
    }
    
    // Apply rotation based on angle
    applyRotationToPage(tempPage, tempEmbeddedPdf[0], rotation, tempWidth, tempHeight, itemWidth, itemHeight);
  }
  
  // Save and return the rotated PDF
  return await tempPdf.save();
};

/**
 * Applies rotation to an embedded image
 * @param pdfDoc The PDF document
 * @param page The page to draw on
 * @param imageBytes The image data
 * @param rotation The rotation angle
 * @param width Target width
 * @param height Target height
 * @param originalWidth Original width
 * @param originalHeight Original height
 */
const applyImageRotation = async (
  pdfDoc: PDFDocument,
  page: PDFPage,
  imageBytes: Uint8Array,
  rotation: number,
  width: number,
  height: number,
  originalWidth: number,
  originalHeight: number
) => {
  try {
    console.log(`PDF Rotation - Applying ${rotation}° rotation to image`);
    
    // Try to embed as JPEG first, if that fails, try PNG
    let image;
    try {
      image = await pdfDoc.embedJpg(imageBytes);
    } catch (e) {
      try {
        image = await pdfDoc.embedPng(imageBytes);
      } catch (e2) {
        console.error('PDF Rotation - Failed to embed image:', e2);
        throw new Error('Failed to embed image: not a valid JPG or PNG');
      }
    }
    
    // Calculate center point of the target page
    const centerX = width / 2;
    const centerY = height / 2;
    console.log(`PDF Rotation - Page center: (${centerX}, ${centerY})`);
    
    // For PDF, (0,0) is at bottom-left corner
    // Apply the appropriate rotation based on angle
    switch (rotation) {
      case 90:
        // For 90° rotation - centered and rotated
        console.log(`PDF Rotation - Applying 90° rotation to image at (${centerX - originalHeight/2}, ${centerY - originalWidth/2})`);
        page.drawImage(image, {
          x: centerX - originalHeight/2,
          y: centerY - originalWidth/2,
          width: originalHeight,  // Swap for 90° rotation
          height: originalWidth,
          rotate: degrees(90),
        });
        break;
        
      case 180:
        // For 180° rotation - centered and rotated
        console.log(`PDF Rotation - Applying 180° rotation to image at (${centerX - originalWidth/2}, ${centerY - originalHeight/2})`);
        page.drawImage(image, {
          x: centerX - originalWidth/2,
          y: centerY - originalHeight/2,
          width: originalWidth,
          height: originalHeight,
          rotate: degrees(180),
        });
        break;
        
      case 270:
        // For 270° rotation - centered and rotated
        console.log(`PDF Rotation - Applying 270° rotation to image at (${centerX - originalHeight/2}, ${centerY - originalWidth/2})`);
        page.drawImage(image, {
          x: centerX - originalHeight/2,
          y: centerY - originalWidth/2,
          width: originalHeight,  // Swap for 270° rotation
          height: originalWidth,
          rotate: degrees(270),
        });
        break;
        
      default:
        // No rotation (0°)
        console.log(`PDF Rotation - No rotation applied to image at (${centerX - originalWidth/2}, ${centerY - originalHeight/2})`);
        page.drawImage(image, {
          x: centerX - originalWidth/2,
          y: centerY - originalHeight/2,
          width: originalWidth,
          height: originalHeight,
        });
    }
    
    console.log(`PDF Rotation - Applied image rotation: ${rotation}°`);
  } catch (error) {
    console.error('PDF Rotation - Error applying image rotation:', error);
    throw error;
  }
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
  
  // Calculate the transformation for the given rotation
  // For PDF coordinates, origin (0,0) is at the bottom left
  
  // Calculate center points
  const centerX = width / 2;
  const centerY = height / 2;
  console.log(`PDF Rotation - Page center: (${centerX}, ${centerY})`);
  
  // Calculate the transformation
  // For consistent rotation, we'll use (0,0) as the base position
  // and then calculate the offset to keep the content centered
  const transform = getRotatedTransform(0, 0, originalWidth, originalHeight, rotation);
  
  // Position so that the content is centered on the page
  let posX = 0;
  let posY = 0;
  
  // Calculate position to center the content after rotation
  if (rotation === 0) {
    // For no rotation, simply center the content
    posX = (width - originalWidth) / 2;
    posY = (height - originalHeight) / 2;
  } else if (rotation === 90) {
    // For 90° rotation
    posX = (width - originalHeight) / 2;
    posY = (height - originalWidth) / 2;
  } else if (rotation === 180) {
    // For 180° rotation
    posX = (width - originalWidth) / 2;
    posY = (height - originalHeight) / 2;
  } else if (rotation === 270) {
    // For 270° rotation
    posX = (width - originalHeight) / 2;
    posY = (height - originalWidth) / 2;
  }
  
  console.log(`PDF Rotation - Centering content at: (${posX}, ${posY})`);
  
  // Apply the transformation
  page.drawPage(embeddedPage, {
    x: posX,
    y: posY,
    width: transform.swapDimensions ? originalHeight : originalWidth,
    height: transform.swapDimensions ? originalWidth : originalHeight,
    rotate: degrees(rotation),
  });
  
  console.log(`PDF Rotation - Applied ${rotation}° rotation centered at (${centerX}, ${centerY})`);
};
