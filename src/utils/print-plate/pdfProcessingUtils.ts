
import { PDFDocument } from 'pdf-lib';
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
    console.log(`PDF Processing - Item center: centerX=${itemPosition.centerX}, centerY=${itemPosition.centerY}`);
    
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
        
        // Get the correct dimensions based on rotation
        const effectiveDimensions = getEffectiveDimensions(
          itemPosition.width,
          itemPosition.height,
          item.rotation
        );
        
        // Draw the rotated page with correct dimensions
        page.drawPage(rotatedPdfEmbed[0], {
          x: itemPosition.x,
          y: itemPosition.y,
          width: effectiveDimensions.width,
          height: effectiveDimensions.height
        });
        
        console.log(`PDF Processing - Successfully added rotated item ${item.id} (${item.rotation}°) to PDF at position x=${itemPosition.x}, y=${itemPosition.y}, width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
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

