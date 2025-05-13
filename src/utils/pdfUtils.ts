
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
    const imgDims = jpgImage.scale(1);

    // Convert dimensions to points (72 dpi)
    const width = imgDims.width;
    const height = imgDims.height;
    
    // Create page with exact image dimensions - no resizing
    const page = pdfDoc.addPage([width, height]);
    
    // Place image at exact coordinates (0,0) - no offset
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
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
    
    // Define cut contour path data based on image dimensions and offset
    // The offset is only for the path, not for resizing the image
    const pathData = createCutContourPath(
      width, 
      height, 
      settings.cutContourOffset
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
