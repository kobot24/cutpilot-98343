
import { PDFDocument } from 'pdf-lib';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { createRotatedPDF } from './pdfRotationUtils';
import { getEffectiveDimensions } from './pdfTransformUtils';

/**
 * Process an item with rotation handling
 * @param pdfDoc The main PDF document
 * @param page The PDF page to add content to
 * @param pdfBytes The PDF data bytes
 * @param item The PDF item
 * @param itemPosition The calculated item position
 */
export const processItemWithRotation = async (
  pdfDoc: any, 
  page: any, 
  pdfBytes: Uint8Array, 
  item: PDFItemType, 
  itemPosition: any
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
          itemPosition.height
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
        addNonRotatedItem(pdfDoc, page, pdfBytes, itemPosition);
      }
    } else {
      // Non-rotated items - standard placement
      addNonRotatedItem(pdfDoc, page, pdfBytes, itemPosition);
    }
  } catch (error) {
    console.error(`PDF Processing - Failed to embed PDF for item ${item.id}:`, error);
  }
};

/**
 * Add a non-rotated PDF item to the page
 * @param pdfDoc The PDF document
 * @param page The page to add the item to
 * @param pdfBytes The PDF data bytes
 * @param itemPosition The item position data
 */
const addNonRotatedItem = async (
  pdfDoc: any, 
  page: any, 
  pdfBytes: Uint8Array, 
  itemPosition: any
) => {
  console.log(`PDF Processing - Adding non-rotated item to PDF`);
  try {
    const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
    page.drawPage(embeddedPdf[0], {
      x: itemPosition.x,
      y: itemPosition.y,
      width: itemPosition.width,
      height: itemPosition.height,
    });
    console.log(`PDF Processing - Successfully added non-rotated item to PDF`);
  } catch (error) {
    console.error(`PDF Processing - Error drawing non-rotated item:`, error);
  }
};
