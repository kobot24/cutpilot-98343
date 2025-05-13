
import { PDFDocument, PDFArray } from 'pdf-lib';
import { createCutContourPath, createSpotColor, createCutContourGraphicsState } from './cutContourUtils';
import { setPdfMetadata, addPdfXCompatibility, arrayBufferToBase64 } from './pdfMetadataUtils';
import { addColorSpaceToResources, addGraphicsStateToResources, addCutContourToPage } from './pdfResourceUtils';

// Create PDF with cut contour from image URL
export const createPdfWithCutContour = async (
  imageUrl: string, 
  settings: { cutContourOffset: number; spotColorName: string }
) => {
  try {
    // Create image element to get dimensions
    const img = document.createElement('img');
    img.src = imageUrl;
    
    // Wait for image to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    // Create PDF document with compatible options for Illustrator
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false // Don't add default metadata that might cause issues
    });
    
    // Add image to PDF - preserving original dimensions
    const jpgImage = await pdfDoc.embedJpg(await fetch(imageUrl).then(r => r.arrayBuffer()));
    
    // Use natural dimensions directly from the image - no scaling
    const naturalWidth = img.naturalWidth;  // Get actual pixel width
    const naturalHeight = img.naturalHeight; // Get actual pixel height
    
    // Convert offset from mm to points (1mm ≈ 2.83 points at 72 DPI)
    const offsetPt = settings.cutContourOffset * 2.83;
    
    // Create page with dimensions that include image size PLUS the offset on all sides
    const pageWidth = naturalWidth + (offsetPt * 2);
    const pageHeight = naturalHeight + (offsetPt * 2);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Place image at offset position so there's space for the cut contour
    page.drawImage(jpgImage, {
      x: offsetPt,  // Position image with offset from left edge
      y: offsetPt,  // Position image with offset from bottom edge
      width: naturalWidth,  // Use original image width
      height: naturalHeight, // Use original image height
    });
    
    const pdfContext = pdfDoc.context;
    
    // Always use "CutContour" as the spot color name
    const spotColorName = "CutContour";
    
    // Create true spot color for the cut contour
    const spotColorData = createSpotColor(pdfContext, spotColorName);
    
    // Add the spot color to the page resources
    addColorSpaceToResources(page, pdfContext, spotColorData);
    
    // Create graphics state for the cut contour
    const gsRef = createCutContourGraphicsState(pdfContext);
    
    // Add the graphics state to the page resources
    addGraphicsStateToResources(page, pdfContext, gsRef);
    
    // Define cut contour path data based on entire page dimensions
    // The offset is applied by making the path larger than the image
    const pathData = createCutContourPath(
      naturalWidth, 
      naturalHeight, 
      settings.cutContourOffset // Pass the actual offset value
    );
    
    // Add the cut contour path to the page
    addCutContourToPage(page, pdfContext, pathData);
    
    // Get file name from URL for metadata
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    
    // Set PDF metadata with Adobe Illustrator compatibility
    setPdfMetadata(pdfDoc, fileName);
    
    // Add PDF/X compatibility information
    addPdfXCompatibility(pdfDoc, pdfContext);
    
    // Save PDF using optimal settings for print workflows
    const pdfBytes = await pdfDoc.save({ 
      useObjectStreams: false,      // Better compatibility with RIP systems
      addDefaultPage: false,        // No blank pages
      objectsPerTick: 50,           // Process in smaller batches
      updateFieldAppearances: false // No form fields
    });
    
    // Convert to base64 for browser display
    const base64String = arrayBufferToBase64(pdfBytes);
    return `data:application/pdf;base64,${base64String}`;
  } catch (error) {
    console.error('Error creating PDF with cut contour:', error);
    throw new Error(`PDF-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};
