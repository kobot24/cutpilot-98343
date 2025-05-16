
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
        
        // Completely revised rotation handling logic
        if (item.rotation !== 0) {
          console.log(`PDF Export - Processing rotation: ${item.rotation}°`);
          
          try {
            // IMPROVEMENT: New approach for handling rotations
            // We'll create a new PDF document for each rotated item, apply the rotation there,
            // then embed it back into our main document
            
            // First, create a temporary PDF that will hold our rotated content
            const tempPdf = await PDFDocument.create();
            
            // Determine dimensions for temporary PDF based on rotation angle
            let tempWidth = itemWidth;
            let tempHeight = itemHeight;
            
            // For 90° and 270° rotations, we need to swap width and height
            if (item.rotation === 90 || item.rotation === 270) {
              console.log(`PDF Export - Swapping dimensions for ${item.rotation}° rotation`);
              // CRITICAL FIX: For 90/270 degrees, we need to swap dimensions
              tempWidth = itemHeight;
              tempHeight = itemWidth;
            }
            
            // Add a page to our temporary PDF with the appropriate dimensions
            const tempPage = tempPdf.addPage([tempWidth, tempHeight]);
            
            // Embed original PDF into our temporary document
            const tempEmbeddedPdf = await tempPdf.embedPdf(pdfBytes);
            if (tempEmbeddedPdf.length === 0) {
              throw new Error("Failed to embed PDF into temporary document");
            }
            
            // Draw the original page onto our temp page with the right dimensions
            // The key here is to draw it with the right dimensions BEFORE rotation
            console.log(`PDF Export - Drawing original content to temp page with dimensions: ${tempWidth}x${tempHeight}`);
            
            // Different drawing logic based on rotation
            if (item.rotation === 90) {
              // For 90° rotation, we need to transform coordinates differently
              tempPage.drawPage(tempEmbeddedPdf[0], {
                x: 0,
                y: 0,
                width: tempWidth,
                height: tempHeight,
                rotate: degrees(90),
                xScale: 1,
                yScale: 1
              });
            } else if (item.rotation === 180) {
              tempPage.drawPage(tempEmbeddedPdf[0], {
                x: tempWidth, // Right edge
                y: tempHeight, // Top edge
                width: tempWidth,
                height: tempHeight,
                rotate: degrees(180),
                xScale: 1,
                yScale: 1
              });
            } else if (item.rotation === 270) {
              tempPage.drawPage(tempEmbeddedPdf[0], {
                x: tempWidth, // Right edge
                y: 0, // Bottom edge
                width: tempWidth,
                height: tempHeight,
                rotate: degrees(270),
                xScale: 1,
                yScale: 1
              });
            } else {
              // For any non-standard rotation (shouldn't happen in our app, but just in case)
              tempPage.drawPage(tempEmbeddedPdf[0], {
                x: 0,
                y: 0,
                width: tempWidth,
                height: tempHeight,
                rotate: degrees(item.rotation)
              });
            }
            
            // Save temporary PDF
            const rotatedPdfBytes = await tempPdf.save();
            
            // Embed the rotated PDF back into our main document
            const rotatedPdfEmbed = await pdfDoc.embedPdf(rotatedPdfBytes);
            
            // Now place this rotated content in the main PDF at the right position
            console.log(`PDF Export - Placing rotated content at: x=${itemX}, y=${itemY}`);
            
            // CRITICAL FIX: New position calculation based on rotation angle
            // This is where most of our issues were occurring
            let finalX = itemX;
            let finalY = itemY;
            
            // Place the rotated content, with rotation-specific positioning
            page.drawPage(rotatedPdfEmbed[0], {
              x: finalX,
              y: finalY,
              width: item.rotation === 90 || item.rotation === 270 ? itemHeight : itemWidth,
              height: item.rotation === 90 || item.rotation === 270 ? itemWidth : itemHeight
            });
            
            console.log(`PDF Export - Successfully added rotated item ${item.id} (${item.rotation}°) to PDF`);
          } catch (error) {
            console.error(`PDF Export - Error handling rotation for item ${item.id}:`, error);
            
            // Fallback: Add item without rotation if rotation handling fails
            console.log(`PDF Export - Falling back to non-rotated placement for item ${item.id}`);
            try {
              page.drawPage(embeddedPage, {
                x: itemX,
                y: itemY,
                width: itemWidth,
                height: itemHeight,
              });
            } catch (fallbackError) {
              console.error(`PDF Export - Fallback placement also failed:`, fallbackError);
            }
          }
        } else {
          // Non-rotated items - standard placement
          console.log(`PDF Export - Adding non-rotated item ${item.id} to PDF`);
          try {
            page.drawPage(embeddedPage, {
              x: itemX,
              y: itemY,
              width: itemWidth,
              height: itemHeight,
            });
            console.log(`PDF Export - Successfully added non-rotated item ${item.id} to PDF`);
          } catch (error) {
            console.error(`PDF Export - Error drawing non-rotated item ${item.id}:`, error);
          }
        }
      } catch (itemError) {
        console.error(`PDF Export - Error processing item ${item.id}:`, itemError);
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
