
import { PDFDocument } from 'pdf-lib';
import { createCutContourPath, createSpotColor, createCutContourGraphicsState } from './cutContourUtils';
import { setPdfMetadata, addPdfXCompatibility, arrayBufferToBase64 } from './pdfMetadataUtils';
import { addColorSpaceToResources, addGraphicsStateToResources, addCutContourToPage } from './pdfResourceUtils';
import { detectImageDPI, fetchImageData, loadImage } from './imageUtils';
import { calculateDimensions } from './dimensionUtils';

/**
 * Create PDF with cut contour from image URL
 * @param imageUrl Source image URL
 * @param settings Configuration for cut contour generation
 * @returns Promise resolving to a data URL of the generated PDF
 */
export const createPdfWithCutContour = async (
  imageUrl: string, 
  settings: { 
    cutContourOffset: number; 
    spotColorName: string;
    sourceDPI?: number; // Optional parameter for source image DPI
  }
) => {
  try {
    console.log('Starting PDF creation process');
    console.log('Settings:', settings);
    
    // Load image and wait for it to be ready with a timeout
    let loadedImg;
    try {
      console.log('Loading image');
      const imageLoadPromise = loadImage(imageUrl);
      
      // Wait for image to load with a timeout
      loadedImg = await Promise.race([
        imageLoadPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Image load timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.error('Error loading image:', error);
      throw new Error(`Fehler beim Laden des Bildes: ${error.message}`);
    }
    
    console.log(`Image loaded: ${loadedImg.naturalWidth}x${loadedImg.naturalHeight} pixels`);
    
    // Create PDF document with compatible options for Illustrator
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false // Don't add default metadata that might cause issues
    });
    
    // Fetch image data
    const imageData = await fetchImageData(imageUrl);
    
    // Add image to PDF - preserving original dimensions
    console.log('Embedding image in PDF');
    const jpgImage = await pdfDoc.embedJpg(imageData);
    
    // Get image dimensions in pixels
    const pixelWidth = loadedImg.naturalWidth;
    const pixelHeight = loadedImg.naturalHeight;
    
    // Use provided sourceDPI if available, otherwise detect or use default
    const imageDPI = detectImageDPI(loadedImg, settings.sourceDPI);
    
    console.log(`Image dimensions: ${pixelWidth}x${pixelHeight} pixels`);
    console.log(`Using DPI: ${imageDPI}`);
    
    // Calculate physical dimensions based on DPI
    const dimensions = calculateDimensions(pixelWidth, pixelHeight, imageDPI);
    const pdfPageWidth = dimensions.points.width;
    const pdfPageHeight = dimensions.points.height;
    
    console.log(`Physical dimensions: ${dimensions.cm.width.toFixed(2)}x${dimensions.cm.height.toFixed(2)} cm`);
    console.log(`PDF page size in points: ${pdfPageWidth.toFixed(2)}x${pdfPageHeight.toFixed(2)} pt`);
    
    // Create page with dimensions that match the physical size
    console.log('Creating PDF page');
    const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);
    
    // Draw image at full page size
    console.log('Drawing image on page');
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: pdfPageWidth,
      height: pdfPageHeight,
    });
    
    const pdfContext = pdfDoc.context;
    
    // Always use "CutContour" as the spot color name
    const spotColorName = "CutContour";
    
    try {
      console.log('Creating spot color for cut contour');
      // Create true spot color for the cut contour
      const spotColorData = createSpotColor(pdfContext, spotColorName);
      
      console.log('Adding spot color to page resources');
      // Add the spot color to the page resources
      addColorSpaceToResources(page, pdfContext, spotColorData);
      
      console.log('Creating graphics state for cut contour');
      // Create graphics state for the cut contour
      const gsRef = createCutContourGraphicsState(pdfContext);
      
      console.log('Adding graphics state to page resources');
      // Add the graphics state to the page resources
      addGraphicsStateToResources(page, pdfContext, gsRef);
      
      // Define cut contour path data based on image dimensions
      // The offset is the inset distance from the edge in mm
      console.log(`Creating cut contour path with offset: ${settings.cutContourOffset}mm`);
      const pathData = createCutContourPath(
        pdfPageWidth, 
        pdfPageHeight, 
        settings.cutContourOffset 
      );
      
      console.log('Adding cut contour path to page');
      // Add the cut contour path to the page
      addCutContourToPage(page, pdfContext, pathData);
    } catch (error) {
      console.error('Error adding cut contour:', error);
      // Continue creating the PDF without cut contour - don't fail the whole process
      console.warn('PDF will be created without cut contour');
    }
    
    // Get file name from URL for metadata
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    
    // Add dimensions and DPI to the filename for clarity
    const fileNameWithDimensions = `${fileName}_${dimensions.cm.width.toFixed(1)}x${dimensions.cm.height.toFixed(1)}cm_${imageDPI}dpi`;
    
    console.log('Setting PDF metadata');
    // Set PDF metadata with Adobe Illustrator compatibility
    setPdfMetadata(pdfDoc, fileNameWithDimensions);
    
    console.log('Adding PDF/X compatibility');
    // Add PDF/X compatibility information
    addPdfXCompatibility(pdfDoc, pdfContext);
    
    // Save PDF using optimal settings for print workflows
    console.log('Saving PDF document');
    const pdfBytes = await pdfDoc.save({ 
      useObjectStreams: false,      // Better compatibility with RIP systems
      addDefaultPage: false,        // No blank pages
      objectsPerTick: 50,           // Process in smaller batches
      updateFieldAppearances: false // No form fields
    });
    
    console.log(`PDF created successfully: ${pdfBytes.byteLength} bytes`);
    
    // Convert to base64 for browser display
    const base64String = arrayBufferToBase64(pdfBytes);
    console.log('PDF converted to base64');
    
    return `data:application/pdf;base64,${base64String}`;
  } catch (error) {
    console.error('Error creating PDF with cut contour:', error);
    throw new Error(`PDF-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};
