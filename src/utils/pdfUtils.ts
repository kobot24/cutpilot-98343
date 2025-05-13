
import { PDFDocument, PDFArray } from 'pdf-lib';
import { createCutContourPath, createSpotColor, createCutContourGraphicsState, cmToPoints, mmToPoints, pointsToCm } from './cutContourUtils';
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
    
    // Calculate the desired physical size in cm (based on 72 DPI standard for PDFs)
    // We'll determine the actual physical size based on the image's natural dimensions
    // Assuming a target DPI of 300 for print quality
    const TARGET_DPI = 300;
    const POINTS_PER_INCH = 72;
    const DPI_SCALE_FACTOR = POINTS_PER_INCH / TARGET_DPI;
    
    // Calculate the target page size in physical dimensions (cm)
    // For a 300 DPI image, divide the pixel dimensions by 300 and multiply by 2.54 (cm per inch)
    const widthInCm = (img.naturalWidth / TARGET_DPI) * 2.54;
    const heightInCm = (img.naturalHeight / TARGET_DPI) * 2.54;
    
    console.log(`Image dimensions: ${img.naturalWidth}x${img.naturalHeight} pixels`);
    console.log(`Target physical size: ${widthInCm.toFixed(2)}x${heightInCm.toFixed(2)} cm`);
    
    // Convert from cm to points for the PDF
    const pdfPageWidth = cmToPoints(widthInCm);
    const pdfPageHeight = cmToPoints(heightInCm);
    
    console.log(`PDF page size in points: ${pdfPageWidth.toFixed(2)}x${pdfPageHeight.toFixed(2)} pt`);
    
    // Create page with dimensions that match the physical size
    const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);
    
    // Draw image at full page size
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: pdfPageWidth,
      height: pdfPageHeight,
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
    
    // Define cut contour path data based on image dimensions
    // The offset is the inset distance from the edge in mm
    const pathData = createCutContourPath(
      pdfPageWidth, 
      pdfPageHeight, 
      settings.cutContourOffset 
    );
    
    // Add the cut contour path to the page
    addCutContourToPage(page, pdfContext, pathData);
    
    // Get file name from URL for metadata
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    
    // Add dimensions to the filename for clarity
    const fileNameWithDimensions = `${fileName}_${widthInCm.toFixed(1)}x${heightInCm.toFixed(1)}cm`;
    
    // Set PDF metadata with Adobe Illustrator compatibility
    setPdfMetadata(pdfDoc, fileNameWithDimensions);
    
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
