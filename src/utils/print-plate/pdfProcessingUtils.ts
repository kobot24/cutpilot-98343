
import { PDFDocument } from 'pdf-lib';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { createRotatedPDF } from './pdfRotationUtils';
import { getRotatedTransform, getEffectiveDimensions, getSeparateTransforms } from './pdfTransformUtils';

/**
 * Process a PDF item and add it to the main PDF document
 * @param pdfDoc The main PDF document
 * @param page The PDF page to add content to
 * @param item The PDF item to process
 * @param pageHeight The PDF page height in points
 */
export const processPDFItem = async (pdfDoc: any, page: any, item: any, pageHeight: number): Promise<void> => {
  console.log(`PDF Processing - Processing item: ${item.id}`);
  console.log(`PDF Processing - Item position: x=${item.x}, y=${item.y}, width=${item.width}, height=${item.height}, rotation=${item.rotation}`);
  console.log(`PDF Processing - Has cached PDF data: ${item.pdfData ? 'Yes, ' + item.pdfData.byteLength + ' bytes' : 'No'}`);
  
  try {
    // Get the PDF bytes - preferring cached data if available
    const pdfBytes = await getPDFDataFromItem(item);
    
    // Calculate position and dimensions in PDF points
    const itemPosition = calculateItemPositionInPoints(item, pageHeight);
    console.log(`PDF Processing - Item position in points: x=${itemPosition.x}, y=${itemPosition.y}, width=${itemPosition.width}, height=${itemPosition.height}`);
    
    // Process based on rotation
    await processItemWithRotation(pdfDoc, page, pdfBytes, item, itemPosition);
    
  } catch (error) {
    console.error(`PDF Processing - Error processing item ${item.id}:`, error);
  }
};

/**
 * Process an item with rotation handling
 * @param pdfDoc The main PDF document
 * @param page The PDF page to add content to
 * @param pdfBytes The PDF data bytes
 * @param item The PDF item
 * @param itemPosition The calculated item position
 */
const processItemWithRotation = async (
  pdfDoc: any, 
  page: any, 
  pdfBytes: Uint8Array, 
  item: any, 
  itemPosition: any
) => {
  try {
    console.log(`PDF Processing - Processing item with rotation: ${item.rotation}°`);
    
    // The key change: Get separate transforms for content and cut contour
    // Content should be rotated, cut contour should remain rectangular
    const centerX = itemPosition.x + (itemPosition.width / 2);
    const centerY = itemPosition.y + (itemPosition.height / 2);
    console.log(`PDF Processing - Item center point: (${centerX}, ${centerY})`);
    
    // If rotation is needed for content
    if (item.rotation !== 0) {
      console.log(`PDF Processing - Creating rotated content for ${item.rotation}°`);
      
      try {
        // Create a rotated PDF for the content only
        const rotatedPdfBytes = await createRotatedPDF(
          pdfBytes, 
          item.rotation, 
          itemPosition.width, 
          itemPosition.height
        );
        
        // Embed the rotated PDF back into our main document
        const rotatedPdfEmbed = await pdfDoc.embedPdf(rotatedPdfBytes);
        
        if (rotatedPdfEmbed.length === 0) {
          throw new Error("Failed to embed rotated PDF");
        }
        
        // Get the effective dimensions of the rotated content
        const effectiveDimensions = getEffectiveDimensions(
          itemPosition.width,
          itemPosition.height,
          item.rotation
        );
        
        // Calculate the position to maintain the same center point
        const posX = centerX - (effectiveDimensions.width / 2);
        const posY = centerY - (effectiveDimensions.height / 2);
        
        console.log(`PDF Processing - Rotated dimensions: width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
        console.log(`PDF Processing - Placing rotated item at: x=${posX}, y=${posY}`);
        
        // Draw the rotated content
        page.drawPage(rotatedPdfEmbed[0], {
          x: posX,
          y: posY,
          width: effectiveDimensions.width,
          height: effectiveDimensions.height
        });
        
        console.log(`PDF Processing - Successfully added rotated item ${item.id}`);
      } catch (error) {
        console.error(`PDF Processing - Error handling rotation for item ${item.id}:`, error);
        
        // Fallback: Add item without rotation if rotation handling fails
        console.log(`PDF Processing - Falling back to non-rotated placement for item ${item.id}`);
        addNonRotatedItem(pdfDoc, page, pdfBytes, itemPosition);
      }
    } else {
      // Non-rotated items - standard placement
      console.log(`PDF Processing - Adding non-rotated item ${item.id} to PDF`);
      await addNonRotatedItem(pdfDoc, page, pdfBytes, itemPosition);
    }
  } catch (error) {
    console.error(`PDF Processing - Failed to process item ${item.id}:`, error);
  }
};

/**
 * Helper function to add a non-rotated item to the page
 */
const addNonRotatedItem = async (
  pdfDoc: any,
  page: any,
  pdfBytes: Uint8Array,
  itemPosition: any
) => {
  try {
    const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
    page.drawPage(embeddedPdf[0], {
      x: itemPosition.x,
      y: itemPosition.y,
      width: itemPosition.width,
      height: itemPosition.height,
    });
    console.log(`PDF Processing - Successfully added non-rotated item to PDF at position x=${itemPosition.x}, y=${itemPosition.y}, width=${itemPosition.width}, height=${itemPosition.height}`);
  } catch (error) {
    console.error(`PDF Processing - Error drawing non-rotated item:`, error);
  }
};
