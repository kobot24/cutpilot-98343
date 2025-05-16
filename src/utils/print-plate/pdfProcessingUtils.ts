
import { PDFDocument, degrees } from 'pdf-lib';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { createRotatedPDF } from './pdfRotationUtils';
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
    // If rotation is needed
    if (item.rotation !== 0) {
      console.log(`PDF Processing - Processing rotation: ${item.rotation}°`);
      
      try {
        // Embed the original PDF into our main document
        const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
        
        if (embeddedPdf.length === 0) {
          throw new Error("Failed to embed PDF");
        }
        
        // Calculate the center point of the original unrotated item in points
        const centerX = itemPosition.x + (itemPosition.width / 2);
        const centerY = itemPosition.y + (itemPosition.height / 2);
        console.log(`PDF Processing - Item center point: (${centerX}, ${centerY})`);

        // For 90° and 270° rotations, we need to swap width and height
        // to maintain the correct aspect ratio
        let rotatedWidth = itemPosition.width;
        let rotatedHeight = itemPosition.height;
        let rotationAngle = 0;
        
        switch (item.rotation) {
          case 90:
            rotatedWidth = itemPosition.height;
            rotatedHeight = itemPosition.width;
            rotationAngle = 90;
            break;
            
          case 180:
            rotationAngle = 180;
            break;
            
          case 270:
            rotatedWidth = itemPosition.height;
            rotatedHeight = itemPosition.width;
            rotationAngle = 270;
            break;
        }
        
        // Calculate the new position to maintain the center point
        const correctedX = centerX - (rotatedWidth / 2);
        const correctedY = centerY - (rotatedHeight / 2);
        
        console.log(`PDF Processing - Corrected position: x=${correctedX}, y=${correctedY}, width=${rotatedWidth}, height=${rotatedHeight}, angle=${rotationAngle}°`);
        
        // Draw the page with proper dimensions and rotation
        page.drawPage(embeddedPdf[0], {
          x: correctedX,
          y: correctedY,
          width: rotatedWidth,
          height: rotatedHeight,
          rotate: degrees(rotationAngle)
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
