
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
    console.log('Starting PDF creation process');
    console.log('Settings:', settings);
    
    // Create image element to get dimensions
    const img = document.createElement('img');
    
    // Create a promise to wait for the image to load
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      
      // Set crossOrigin to anonymous to avoid CORS issues with data URLs
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
    });
    
    // Wait for image to load with a timeout
    const loadedImg = await Promise.race([
      imageLoadPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image load timeout')), 10000)
      )
    ]);
    
    console.log(`Image loaded: ${img.naturalWidth}x${img.naturalHeight} pixels`);
    
    // Create PDF document with compatible options for Illustrator
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false // Don't add default metadata that might cause issues
    });
    
    // Fetch image data - wrap in try-catch for better error handling
    let imageData;
    try {
      console.log('Fetching image data');
      // For data URLs, we can directly use the image src without fetching
      if (imageUrl.startsWith('data:')) {
        // Extract base64 content from data URL
        const base64Content = imageUrl.split(',')[1];
        imageData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0)).buffer;
        console.log('Using data URL directly');
      } else {
        // For regular URLs, fetch the data
        imageData = await fetch(imageUrl)
          .then(r => {
            if (!r.ok) throw new Error(`Failed to fetch image: ${r.status} ${r.statusText}`);
            return r.arrayBuffer();
          });
        console.log('Image fetched from URL');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error(`Fehler beim Laden des Bildes: ${error.message}`);
    }
    
    // Add image to PDF - preserving original dimensions
    console.log('Embedding image in PDF');
    const jpgImage = await pdfDoc.embedJpg(imageData);
    
    // Calculate the desired physical size in cm (based on 72 DPI standard for PDFs)
    // We'll determine the actual physical size based on the image's natural dimensions
    // Assuming a target DPI of 300 for print quality
    const TARGET_DPI = 300;
    const POINTS_PER_INCH = 72;
    
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
    
    // Add dimensions to the filename for clarity
    const fileNameWithDimensions = `${fileName}_${widthInCm.toFixed(1)}x${heightInCm.toFixed(1)}cm`;
    
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
