
import { PDFDocument } from 'pdf-lib';
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

    // Calculate the scale factor between canvas pixels and PDF points
    // We'll assume that our canvas uses the same aspect ratio as the PDF page
    // This is a simplified approach and might need refinement based on actual canvas size
    
    // For each PDF item on the plate
    for (const item of items) {
      if (!item.pdfUrl) continue;
      
      try {
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
        
        if (embedPdf.length === 0) continue;
        
        const embeddedPage = embedPdf[0];
        
        // Calculate position and dimensions in PDF points
        // Convert from screen pixels to PDF points using the plate dimensions
        const scaleX = pageWidth / 100; // Assuming the canvas width is normalized to 100
        const scaleY = pageHeight / 100; // Assuming the canvas height is normalized to 100
        
        // Calculate position and size in PDF coordinates
        const x = (item.x / 100) * pageWidth;
        const y = pageHeight - ((item.y / 100) * pageHeight) - ((item.height / 100) * pageHeight); // Flip Y coordinate for PDF
        const width = (item.width / 100) * pageWidth;
        const height = (item.height / 100) * pageHeight;
        
        // Draw the embedded PDF page onto the main page
        // Apply rotation if needed
        page.drawPage(embeddedPage, {
          x,
          y,
          width,
          height,
          rotate: item.rotation * (Math.PI / 180), // Convert degrees to radians
        });
      } catch (error) {
        console.error(`Error embedding PDF for item ${item.id}:`, error);
      }
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
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
