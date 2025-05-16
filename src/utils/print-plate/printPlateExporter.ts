
import { PDFDocument, degrees, rgb } from 'pdf-lib';
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
    console.log(`PDF Export - Processing ${items.length} items`);

    // For each PDF item on the plate
    for (const item of items) {
      if (!item.pdfUrl && !item.pdfData) {
        console.log(`PDF Export - Skipping item with no PDF URL or data: ${item.id}`);
        continue;
      }
      
      try {
        console.log(`PDF Export - Processing item: ${item.id}`);
        console.log(`PDF Export - Item position: x=${item.x}, y=${item.y}, width=${item.width}, height=${item.height}, rotation=${item.rotation}`);
        console.log(`PDF Export - Has cached PDF data: ${item.pdfData ? 'Yes, ' + item.pdfData.byteLength + ' bytes' : 'No'}`);
        
        // Get the PDF bytes - preferring cached data if available
        let pdfBytes: Uint8Array;
        
        if (item.pdfData) {
          // Use the cached PDF data if available
          console.log(`PDF Export - Using cached PDF data: ${item.pdfData.byteLength} bytes`);
          pdfBytes = item.pdfData;
        } else if (item.pdfUrl.startsWith('blob:') || item.pdfUrl.startsWith('data:')) {
          // Fetch the PDF data from the URL with explicit error handling
          console.log(`PDF Export - Fetching PDF from URL: ${item.pdfUrl.substring(0, 50)}...`);
          try {
            const response = await fetch(item.pdfUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            pdfBytes = new Uint8Array(arrayBuffer);
            console.log(`PDF Export - Successfully fetched PDF: ${pdfBytes.byteLength} bytes`);
          } catch (error) {
            console.error(`PDF Export - Failed to fetch PDF from URL:`, error);
            throw error; // Re-throw to be caught by outer try-catch
          }
        } else {
          // If it's a regular URL, fetch it with explicit error handling
          console.log(`PDF Export - Fetching PDF from regular URL`);
          try {
            const response = await fetch(item.pdfUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            pdfBytes = new Uint8Array(arrayBuffer);
            console.log(`PDF Export - Successfully fetched PDF: ${pdfBytes.byteLength} bytes`);
          } catch (error) {
            console.error(`PDF Export - Failed to fetch PDF from URL:`, error);
            throw error;
          }
        }
        
        // Check if we have valid PDF bytes before proceeding
        if (!pdfBytes || pdfBytes.length === 0) {
          console.error(`PDF Export - No valid PDF data for item: ${item.id}`);
          continue;
        }
        
        // Try to embed the PDF document with explicit error handling
        let embedPdf;
        try {
          embedPdf = await pdfDoc.embedPdf(pdfBytes);
          console.log(`PDF Export - Successfully embedded PDF with ${embedPdf.length} pages`);
        } catch (error) {
          console.error(`PDF Export - Failed to embed PDF for item ${item.id}:`, error);
          continue; // Skip this item and try the next one
        }
        
        if (embedPdf.length === 0) {
          console.log(`PDF Export - No pages in embedded PDF for item: ${item.id}`);
          continue;
        }
        
        const embeddedPage = embedPdf[0];
        
        // Calculate position and dimensions in PDF points
        // Item position and dimensions are in cm, convert to points
        const itemX = item.x * CM_TO_POINTS;
        
        // Fix: Correctly calculate Y position by flipping the coordinate system
        // In PDFs, the origin is at the bottom-left, but in our UI it's at the top-left
        const itemY = pageHeight - (item.y * CM_TO_POINTS) - (item.height * CM_TO_POINTS);
        
        const itemWidth = item.width * CM_TO_POINTS;
        const itemHeight = item.height * CM_TO_POINTS;
        
        // Get the center of the item for rotation calculations
        const itemCenterX = itemX + (itemWidth / 2);
        const itemCenterY = itemY + (itemHeight / 2);
        
        console.log(`PDF Export - Item position in points: x=${itemX}, y=${itemY}, width=${itemWidth}, height=${itemHeight}`);
        console.log(`PDF Export - Item center: centerX=${itemCenterX}, centerY=${itemCenterY}`);
        
        // Completely rewritten rotation handling to fix issues with 90°, 180°, and 270° rotations
        if (item.rotation !== 0) {
          console.log(`PDF Export - Processing rotation: ${item.rotation}°`);
          
          try {
            // Approach: For rotated items, we'll embed the PDF, then create a form XObject
            // that we can rotate and position correctly
            
            // First, create a temporary PDF with the item
            const tempPdf = await PDFDocument.create();
            let tempWidth = itemWidth;
            let tempHeight = itemHeight;
            
            // For 90° and 270° rotations, we need to swap width and height
            // This is crucial for the correct placement
            if (item.rotation === 90 || item.rotation === 270) {
              console.log(`PDF Export - Swapping dimensions for ${item.rotation}° rotation`);
              tempWidth = itemHeight;
              tempHeight = itemWidth;
            }
            
            // Create a temporary page with the right dimensions
            const tempPage = tempPdf.addPage([tempWidth, tempHeight]);
            
            // Draw the embedded page onto the temporary page
            tempPage.drawPage(embeddedPage, {
              x: 0,
              y: 0,
              width: tempWidth,
              height: tempHeight,
              rotate: degrees(0) // No rotation yet
            });
            
            // Save the temporary PDF
            const tempPdfBytes = await tempPdf.save();
            
            // Re-embed this prepared content
            const rotatedPdfEmbed = await pdfDoc.embedPdf(tempPdfBytes);
            
            if (rotatedPdfEmbed.length === 0) {
              throw new Error("Failed to embed rotated PDF");
            }
            
            // Calculate the position for the rotated item
            // The key insight: We need different positioning logic depending on rotation angle
            let drawX = itemX;
            let drawY = itemY;
            
            // Apply rotation and adjust position
            switch (item.rotation) {
              case 90:
                // For 90° rotation, adjust position since width and height swap
                drawY = pageHeight - itemY - itemWidth; // Start from bottom edge
                page.drawPage(rotatedPdfEmbed[0], {
                  x: drawX,
                  y: drawY,
                  width: tempWidth,
                  height: tempHeight,
                  rotate: degrees(90)
                });
                break;
                
              case 180:
                // For 180° rotation, adjust both X and Y
                drawX = itemX + itemWidth; // Move to right edge
                drawY = itemY + itemHeight; // Move to top edge
                page.drawPage(rotatedPdfEmbed[0], {
                  x: drawX,
                  y: drawY, 
                  width: itemWidth,
                  height: itemHeight,
                  rotate: degrees(180)
                });
                break;
                
              case 270:
                // For 270° rotation, adjust X since width and height swap
                drawX = itemX + itemHeight; // Start from right edge considering swapped dimensions
                page.drawPage(rotatedPdfEmbed[0], {
                  x: drawX,
                  y: drawY,
                  width: tempWidth, 
                  height: tempHeight,
                  rotate: degrees(270)
                });
                break;
                
              default:
                // For any other custom rotation (not expected in this app)
                page.drawPage(rotatedPdfEmbed[0], {
                  x: drawX,
                  y: drawY,
                  width: itemWidth,
                  height: itemHeight,
                  rotate: degrees(item.rotation)
                });
                break;
            }
            
            console.log(`PDF Export - Successfully applied ${item.rotation}° rotation using coordinates: x=${drawX}, y=${drawY}`);
            
          } catch (error) {
            console.error(`PDF Export - Error handling rotation for item ${item.id}:`, error);
            
            // Fallback: If rotation fails, try to add without rotation
            console.log(`PDF Export - Attempting fallback without rotation for item ${item.id}`);
            try {
              page.drawPage(embeddedPage, {
                x: itemX,
                y: itemY,
                width: itemWidth,
                height: itemHeight,
              });
            } catch (fallbackError) {
              console.error(`PDF Export - Fallback also failed for item ${item.id}:`, fallbackError);
            }
          }
        } else {
          // Non-rotated items can use the simpler drawing approach
          try {
            page.drawPage(embeddedPage, {
              x: itemX,
              y: itemY,
              width: itemWidth,
              height: itemHeight,
            });
          } catch (error) {
            console.error(`PDF Export - Error drawing non-rotated item ${item.id}:`, error);
          }
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
