
import { PDFDocument } from 'pdf-lib';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { processItemWithRotation } from './pdfRotationProcessor';

/**
 * Process a PDF item and add it to the main PDF document
 * with enhanced error handling and logging
 * @param pdfDoc The main PDF document
 * @param page The PDF page to add content to
 * @param item The PDF item to process
 * @param pageHeight The PDF page height in points
 */
export const processPDFItem = async (
  pdfDoc: any, 
  page: any, 
  item: PDFItemType, 
  pageHeight: number
): Promise<boolean> => {
  console.log(`PDF Processing - Processing item: ${item.id}, fileId: ${item.fileId || 'none'}`);
  console.log(`PDF Processing - Item position: x=${item.x}, y=${item.y}, width=${item.width}, height=${item.height}, rotation=${item.rotation}`);
  console.log(`PDF Processing - Using URL: ${item.pdfUrl.substring(0, 30)}...`);
  
  try {
    // Get the PDF bytes from the URL - with retries handled in getPDFDataFromItem
    const pdfBytes = await getPDFDataFromItem(item);
    
    if (!pdfBytes || pdfBytes.byteLength === 0) {
      throw new Error(`Empty PDF data for item ${item.id}`);
    }
    
    // Calculate position and dimensions in PDF points
    const itemPosition = calculateItemPositionInPoints(item, pageHeight);
    console.log(`PDF Processing - Item position in points: x=${itemPosition.x}, y=${itemPosition.y}, width=${itemPosition.width}, height=${itemPosition.height}`);
    
    // Process based on rotation
    await processItemWithRotation(pdfDoc, page, pdfBytes, item, itemPosition);
    console.log(`PDF Processing - Successfully processed item: ${item.id}`);
    return true;
    
  } catch (error) {
    console.error(`PDF Processing - Error processing item ${item.id}:`, error);
    return false;
  }
};
