
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
    
    // Add image to PDF - attempting to preserve CMYK colorspace if present
    const jpgImage = await pdfDoc.embedJpg(await fetch(imageUrl).then(r => r.arrayBuffer()));
    const imgDims = jpgImage.scale(1);

    // Convert dimensions to mm for printing standards
    const mmToPt = 2.83465; // 1mm ≈ 2.83465pt at 72dpi
    const bleedMM = settings.cutContourOffset;
    const bleedPt = bleedMM * mmToPt;
    
    // Create page with precise bleed
    const page = pdfDoc.addPage([
      Math.ceil(imgDims.width + (bleedPt * 2)),
      Math.ceil(imgDims.height + (bleedPt * 2))
    ]);
    
    // Place image with bleed offset
    page.drawImage(jpgImage, {
      x: bleedPt,
      y: bleedPt,
      width: imgDims.width,
      height: imgDims.height,
    });
    
    const pdfContext = pdfDoc.context;
    const spotColorName = settings.spotColorName || 'CutContour';
    
    // Create spot color for the cut contour
    const spotColorRef = createSpotColor(pdfContext, spotColorName);
    
    // Add the spot color to the page resources
    addColorSpaceToResources(page, pdfContext, spotColorRef);
    
    // Create graphics state for the cut contour
    const gsRef = createCutContourGraphicsState(pdfContext);
    
    // Add the graphics state to the page resources
    addGraphicsStateToResources(page, pdfContext, gsRef);
    
    // Define cut contour path data
    const pathData = createCutContourPath(
      imgDims.width + (bleedPt * 2), 
      imgDims.height + (bleedPt * 2), 
      settings.cutContourOffset
    );
    
    // Add the cut contour path to the page
    addCutContourToPage(page, pdfContext, pathData);
    
    // Get file name from URL for metadata
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    
    // Set PDF metadata
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
