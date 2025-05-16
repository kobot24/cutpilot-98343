import { PDFDocument } from 'pdf-lib';
import { getPDFDataFromItem } from './pdfDataUtils';
import { calculateItemPositionInPoints } from './pdfCoordinateUtils';
import { createRotatedPDF } from './pdfRotationUtils';
import { getRotatedTransform, getEffectiveDimensions } from './pdfTransformUtils';
import { degrees } from 'pdf-lib';

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
    // If rotation is needed
    if (item.rotation === 90) {
      console.log(`PDF Processing - Processing 90° rotation`);
      
      try {
        // Embed the original PDF
        const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
        
        if (embeddedPdf.length === 0) {
          throw new Error("Failed to embed original PDF");
        }
        
        console.log(`PDF Processing - Drawing 90° rotated page at x=${itemPosition.x}, y=${itemPosition.y}`);
        console.log(`PDF Processing - Using swapped dimensions: width=${itemPosition.height}, height=${itemPosition.width}`);
        
        // Draw the rotated page with swapped dimensions and rotation
        page.drawPage(embeddedPdf[0], {
          x: itemPosition.x,
          y: itemPosition.y,
          width: itemPosition.height,   // swap dimensions
          height: itemPosition.width,
          rotate: degrees(90)           // 90° clockwise rotation
        });
        
        console.log(`PDF Processing - Successfully added 90° rotated item ${item.id}`);
      } catch (error) {
        console.error(`PDF Processing - Error applying 90° rotation for item ${item.id}:`, error);
        
        // Fallback: Add item without rotation if transformation fails
        try {
          console.log(`PDF Processing - Attempting to add item ${item.id} without rotation as fallback`);
          const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
          page.drawPage(embeddedPdf[0], {
            x: itemPosition.x,
            y: itemPosition.y,
            width: itemPosition.width,
            height: itemPosition.height,
          });
        } catch (lastResortError) {
          console.error(`PDF Processing - Fallback also failed for item ${item.id}:`, lastResortError);
        }
      }
    } else if (item.rotation !== 0) {
      // Other rotations - use existing logic
      console.log(`PDF Processing - Processing rotation: ${item.rotation}°`);
      
      try {
        // Embed the original PDF
        const originalPdfEmbed = await pdfDoc.embedPdf(pdfBytes);
        
        if (originalPdfEmbed.length === 0) {
          throw new Error("Failed to embed original PDF");
        }
        
        // Get the effective dimensions based on rotation
        const effectiveDimensions = getEffectiveDimensions(
          itemPosition.width,
          itemPosition.height,
          item.rotation
        );
        
        console.log(`PDF Processing - Effective dimensions for rotation: width=${effectiveDimensions.width}, height=${effectiveDimensions.height}`);
        
        // Get the transformation matrix
        const transform = getRotatedTransform(
          itemPosition.x, 
          itemPosition.y, 
          itemPosition.width, 
          itemPosition.height, 
          item.rotation
        );
        
        console.log(`PDF Processing - Using transformation matrix: [${transform.matrix}]`);
        
        // Draw the page with transformation
        page.drawPage(originalPdfEmbed[0], {
          width: itemPosition.width,
          height: itemPosition.height,
          transform: {
            matrix: transform.matrix
          }
        });
        
        console.log(`PDF Processing - Successfully added rotated item ${item.id}`);
      } catch (error) {
        console.error(`PDF Processing - Error applying transformation for item ${item.id}:`, error);
        
        // Fallback: Add item without rotation if transformation fails
        // Try using the alternative rotation method
        try {
          console.log(`PDF Processing - Trying alternative rotation method for item ${item.id}`);
          
          // Create a rotated PDF
          const rotatedPdfBytes = await createRotatedPDF(
            pdfBytes, 
            item.rotation, 
            itemPosition.width, 
            itemPosition.height
          );
          
          // Embed the rotated PDF
          const rotatedPdfEmbed = await pdfDoc.embedPdf(rotatedPdfBytes);
          
          if (rotatedPdfEmbed.length === 0) {
            throw new Error("Failed to embed rotated PDF");
          }
          
          // Get effective dimensions
          const effectiveDim = getEffectiveDimensions(
            itemPosition.width,
            itemPosition.height,
            item.rotation
          );
          
          // Draw the rotated page
          page.drawPage(rotatedPdfEmbed[0], {
            x: itemPosition.x,
            y: itemPosition.y,
            width: effectiveDim.width,
            height: effectiveDim.height
          });
          
          console.log(`PDF Processing - Successfully added rotated item ${item.id} using alternative method`);
        } catch (fallbackError) {
          console.error(`PDF Processing - Alternative rotation also failed:`, fallbackError);
          
          // Last resort: Add without rotation
          try {
            console.log(`PDF Processing - Attempting to add item ${item.id} without rotation`);
            const embeddedPdf = await pdfDoc.embedPdf(pdfBytes);
            page.drawPage(embeddedPdf[0], {
              x: itemPosition.x,
              y: itemPosition.y,
              width: itemPosition.width,
              height: itemPosition.height,
            });
          } catch (lastResortError) {
            console.error(`PDF Processing - All methods failed for item ${item.id}:`, lastResortError);
          }
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
