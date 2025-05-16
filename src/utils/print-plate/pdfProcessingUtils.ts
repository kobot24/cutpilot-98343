
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
        
        // Calculate the correct position for the rotated item to maintain center point
        let posX = 0;
        let posY = 0;
        
        // Adjust position based on rotation angle to preserve the center point
        switch (item.rotation) {
          case 90:
            // For 90° rotation, we need to offset the position correctly
            // to maintain the same center point
            posX = centerX - (effectiveDimensions.width / 2);
            posY = centerY - (effectiveDimensions.height / 2);
            console.log(`PDF Processing - Adjusted position for 90° rotation: (${posX}, ${posY})`);
            break;
            
          case 180:
            posX = centerX - (effectiveDimensions.width / 2);
            posY = centerY - (effectiveDimensions.height / 2);
            console.log(`PDF Processing - Adjusted position for 180° rotation: (${posX}, ${posY})`);
            break;
            
          case 270:
            posX = centerX - (effectiveDimensions.width / 2);
            posY = centerY - (effectiveDimensions.height / 2);
            console.log(`PDF Processing - Adjusted position for 270° rotation: (${posX}, ${posY})`);
            break;
            
          default:
            posX = itemPosition.x;
            posY = itemPosition.y;
        }
        
        // Add a horizontal shift for 90° and 270° rotations to match the UI preview
        // This is an additional adjustment to account for the specific layout requirements
        if (item.rotation === 90) {
          // Move slightly to the right for 90° rotation
          posX += 2; // Small adjustment in points to match preview better
        } else if (item.rotation === 270) {
          // Move slightly to account for 270° rotation
          posX -= 2; // Small adjustment in points to match preview better
        }
        
        console.log(`PDF Processing - Final position for rotated item: x=${posX}, y=${posY}`);
        
        // Draw the rotated page with the correct dimensions and position
        page.drawPage(rotatedPdfEmbed[0], {
          x: posX,
          y: posY,
          width: effectiveDimensions.width,
          height: effectiveDimensions.height
        });
        
        console.log(`PDF Processing - Successfully added rotated item ${item.id} (${item.rotation}°) to PDF at position x=${posX}, y=${posY}, width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
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
