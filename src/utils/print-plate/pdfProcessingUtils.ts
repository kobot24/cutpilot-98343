
import { PDFDocument } from 'pdf-lib';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { createRotatedPDF } from './pdfRotationUtils';
import { getRotatedTransform, getEffectiveDimensions } from './pdfTransformUtils';
import { degrees } from 'pdf-lib';
import { applyRotationToPage } from './pdfRotationTransformations';

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
    // Embed the original PDF
    const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
    
    if (embeddedPdf.length === 0) {
      throw new Error("Failed to embed original PDF");
    }
    
    const embeddedPage = embeddedPdf[0];
    const x = itemPosition.x;
    const y = itemPosition.y;
    const width = itemPosition.width;
    const height = itemPosition.height;
    
    // Use the improved rotation helper that maintains center point
    applyRotationToPage(
      page,
      embeddedPage,
      item.rotation,
      width,
      height,
      width,
      height
    );
    
  } catch (error) {
    console.error(`PDF Processing - Failed to process item with rotation: ${error}`);
    
    // Fallback: Add item without rotation if transformation fails
    try {
      console.log(`PDF Processing - Attempting fallback without rotation for item ${item.id}`);
      const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
      
      if (embeddedPdf.length === 0) {
        throw new Error("Failed to embed PDF in fallback mode");
      }
      
      page.drawPage(embeddedPdf[0], {
        x: itemPosition.x,
        y: itemPosition.y,
        width: itemPosition.width,
        height: itemPosition.height,
      });
      
      console.log(`PDF Processing - Successfully added item ${item.id} using fallback method`);
    } catch (fallbackError) {
      console.error(`PDF Processing - Fallback also failed for item ${item.id}:`, fallbackError);
    }
  }
};
