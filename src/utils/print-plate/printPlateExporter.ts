
import { PDFDocument, degrees } from 'pdf-lib';
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';

// Convert cm to points (PDF uses points as unit, 1 cm = 28.35 points)
const CM_TO_POINTS = 28.35;

export const exportPrintPlateToPDF = async (
  items: PDFItemType[],
  plateSize: PrintPlateSize
): Promise<Uint8Array | null> => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Set page size in points
    const pageWidth = plateSize.width * CM_TO_POINTS;
    const pageHeight = plateSize.height * CM_TO_POINTS;
    
    // Add a page with the specified dimensions
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    console.log(`PDF Export - Creating plate: ${plateSize.width}x${plateSize.height} cm`);
    console.log(`PDF Export - Page created with dimensions: ${pageWidth}x${pageHeight} points`);

    // For each PDF item on the plate
    for (const item of items) {
      if (!item.pdfUrl) {
        console.log(`PDF Export - Skipping item with no PDF URL: ${item.id}`);
        continue;
      }
      
      try {
        console.log(`PDF Export - Processing item: ${item.id}`);
        console.log(`PDF Export - Item position: x=${item.x}, y=${item.y}, width=${item.width}, height=${item.height}, rotation=${item.rotation}`);
        
        // Check if the pdfUrl is a blob URL or a data URL
        let pdfBytes: Uint8Array;
        
        if (item.pdfUrl.startsWith('blob:') || item.pdfUrl.startsWith('data:')) {
          // Fetch the PDF data from the URL
          const response = await fetch(item.pdfUrl);
          const arrayBuffer = await response.arrayBuffer();
          pdfBytes = new Uint8Array(arrayBuffer);
        } else {
          // If it's a regular URL, fetch it
          const response = await fetch(item.pdfUrl);
          const arrayBuffer = await response.arrayBuffer();
          pdfBytes = new Uint8Array(arrayBuffer);
        }
        
        // Embed the PDF document
        const embedPdf = await pdfDoc.embedPdf(pdfBytes);
        
        if (embedPdf.length === 0) {
          console.log(`PDF Export - No pages in embedded PDF for item: ${item.id}`);
          continue;
        }
        
        const embeddedPage = embedPdf[0];
        
        // Calculate position and dimensions in PDF points
        // Item position and dimensions are in cm, convert to points
        const x = item.x * CM_TO_POINTS;
        
        // Fix: Correctly calculate Y position by flipping the coordinate system
        // In PDFs, the origin is at the bottom-left, but in our UI it's at the top-left
        const y = pageHeight - (item.y * CM_TO_POINTS) - (item.height * CM_TO_POINTS);
        
        const width = item.width * CM_TO_POINTS;
        const height = item.height * CM_TO_POINTS;
        
        console.log(`PDF Export - Calculated PDF positions: x=${x}, y=${y}, width=${width}, height=${height}`);
        
        // When drawing the PDF with rotation, we need to apply the rotation around the center of the item
        // First get the center point of the item
        const centerX = x + (width / 2);
        const centerY = y + (height / 2);
        
        console.log(`PDF Export - Item center for rotation: centerX=${centerX}, centerY=${centerY}`);
        console.log(`PDF Export - Applying rotation: ${item.rotation} degrees`);

        // Draw the embedded PDF page onto the main page
        // If there's rotation, we need to handle it properly with the correct origin
        if (item.rotation !== 0) {
          // For rotated items, we need to:
          // 1. Translate to the center of where the item should be
          // 2. Rotate around that center
          // 3. Translate back by half width/height to position correctly
          
          // Save current state
          page.pushOperators();
          
          // Move to center point
          page.moveToCanvas(centerX, centerY);
          
          // Rotate around center
          page.rotate(degrees(item.rotation));
          
          // Move back to where top-left should be after rotation (negative half width/height)
          page.moveToCanvas(-width / 2, -height / 2);
          
          // Now draw the page at this transformed position
          page.drawPage(embeddedPage, {
            width,
            height,
            x: 0,
            y: 0,
          });
          
          // Restore state
          page.popOperators();
        } else {
          // For non-rotated items, drawing is straightforward
          page.drawPage(embeddedPage, {
            x,
            y,
            width,
            height,
          });
        }
        
        console.log(`PDF Export - Successfully added item ${item.id} to PDF`);
      } catch (error) {
        console.error(`Error embedding PDF for item ${item.id}:`, error);
      }
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    console.log(`PDF Export - Successfully created PDF: ${pdfBytes.byteLength} bytes`);
    return pdfBytes;
  } catch (error) {
    console.error('Error creating Print Plate PDF:', error);
    return null;
  }
};

// Helper function to download PDF bytes as a file
export const downloadPDF = (pdfBytes: Uint8Array, fileName: string = 'printplate.pdf') => {
  // Create a blob from the PDF bytes
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append to the document body
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
