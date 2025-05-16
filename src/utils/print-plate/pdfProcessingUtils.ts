
import { PDFDocument } from 'pdf-lib';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { createRotatedPDF, isPDF } from './pdfRotationUtils';
import { getRotatedTransform, getEffectiveDimensions } from './pdfTransformUtils';

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
    
    // Check if source is an actual PDF file or an image
    const isSourcePDF = isPDF(item.pdfUrl || pdfBytes);
    console.log(`PDF Processing - Source file is a ${isSourcePDF ? 'PDF' : 'image'}`);
    
    // Calculate position and dimensions in PDF points
    const itemPosition = calculateItemPositionInPoints(item, pageHeight);
    console.log(`PDF Processing - Item position in points: x=${itemPosition.x}, y=${itemPosition.y}, width=${itemPosition.width}, height=${itemPosition.height}`);
    
    // Process based on rotation
    await processItemWithRotation(pdfDoc, page, pdfBytes, item, itemPosition, isSourcePDF);
    
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
 * @param isSourcePDF Whether the source is an actual PDF file
 */
const processItemWithRotation = async (
  pdfDoc: any, 
  page: any, 
  pdfBytes: Uint8Array, 
  item: any, 
  itemPosition: any,
  isSourcePDF: boolean = true
) => {
  try {
    // If rotation is needed
    if (item.rotation !== 0) {
      console.log(`PDF Processing - Processing rotation: ${item.rotation}°`);
      
      try {
        // Get the effective dimensions based on rotation
        const effectiveDimensions = getEffectiveDimensions(
          itemPosition.width,
          itemPosition.height,
          item.rotation
        );
        
        console.log(`PDF Processing - Effective dimensions for rotation: width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
        
        // Create a rotated PDF
        const rotatedPdfBytes = await createRotatedPDF(
          pdfBytes, 
          item.rotation, 
          itemPosition.width, 
          itemPosition.height,
          !isSourcePDF // Pass the flag indicating if this is an image source
        );
        
        // Embed the rotated PDF back into our main document
        const rotatedPdfEmbed = await pdfDoc.embedPdf(rotatedPdfBytes);
        
        if (rotatedPdfEmbed.length === 0) {
          throw new Error("Failed to embed rotated PDF");
        }
        
        // Calculate the center point of the original unrotated item
        const centerX = itemPosition.x + (itemPosition.width / 2);
        const centerY = itemPosition.y + (itemPosition.height / 2);
        console.log(`PDF Processing - Item center point: (${centerX}, ${centerY})`);
        
        // Calculate the position for the rotated item to maintain center point
        // Adjust position based on rotation to correctly position the item
        let posX = 0;
        let posY = 0;
        
        if (item.rotation === 90 || item.rotation === 270) {
          // For 90° and 270° rotations, we need to account for the swapped dimensions
          posX = centerX - (effectiveDimensions.width / 2);
          posY = centerY - (effectiveDimensions.height / 2);
        } else {
          // For 0° and 180° rotations
          posX = centerX - (effectiveDimensions.width / 2);
          posY = centerY - (effectiveDimensions.height / 2);
        }
        
        console.log(`PDF Processing - Final position for rotated item: x=${posX}, y=${posY}, width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
        
        // Draw the rotated page with the correct dimensions and position
        page.drawPage(rotatedPdfEmbed[0], {
          x: posX,
          y: posY,
          width: effectiveDimensions.width,
          height: effectiveDimensions.height
        });
        
        console.log(`PDF Processing - Successfully added rotated item ${item.id} (${item.rotation}°) to PDF`);
      } catch (error) {
        console.error(`PDF Processing - Error handling rotation for item ${item.id}:`, error);
        
        // Fallback: Add item without rotation if rotation handling fails
        console.log(`PDF Processing - Falling back to non-rotated placement for item ${item.id}`);
        try {
          const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
          page.drawPage(embeddedPdf[0], {
            x: itemPosition.x,
            y: itemPosition.y,
            width: itemPosition.width,
            height: itemPosition.height,
          });
        } catch (fallbackError) {
          console.error(`PDF Processing - Fallback placement also failed:`, fallbackError);
        }
      }
    } else {
      // Non-rotated items - standard placement
      console.log(`PDF Processing - Adding non-rotated item ${item.id} to PDF`);
      try {
        const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
        page.drawPage(embeddedPdf[0], {
          x: itemPosition.x,
          y: itemPosition.y,
          width: itemPosition.width,
          height: itemPosition.height,
        });
        console.log(`PDF Processing - Successfully added non-rotated item ${item.id} to PDF`);
      } catch (error) {
        console.error(`PDF Processing - Error drawing non-rotated item ${item.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`PDF Processing - Failed to embed PDF for item ${item.id}:`, error);
  }
};
