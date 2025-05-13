
import { PDFDocument, PDFName, PDFArray, PDFNumber, rgb, PDFString, PDFDict } from 'pdf-lib';

// Create a rectangular path with rounded corners
export const createCutContourPath = (width: number, height: number, offset: number): string => {
  // Convert mm to points (72 dpi)
  const offsetPt = offset * 2.83; 
  const x = offsetPt;
  const y = offsetPt;
  const w = width - (offsetPt * 2);
  const h = height - (offsetPt * 2);
  const r = 10; // Corner radius

  return `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
};

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
    
    // Create page with precise bleed (3mm standard)
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
    
    // Create a spot color specifically for CutContour with 100% Magenta
    const spotColorName = settings.spotColorName || 'CutContour';
    const pdfContext = pdfDoc.context;
    
    // Create a PDF/X-compatible separation color space for CutContour
    // Use 100% Magenta as the spot color (0,1,0,0 in CMYK)
    const spotColorDict = pdfContext.obj({
      FunctionType: 2,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1, 0, 1], // CMYK
      C0: [0, 0, 0, 0], // CMYK Black
      C1: [0, 1, 0, 0], // 100% Magenta in CMYK
      N: 1, // Linear interpolation
    });
    
    // Create separation color space following PDF/X standards
    const spotColorSpace = pdfContext.obj([
      PDFName.of('Separation'),
      PDFName.of(spotColorName),
      PDFName.of('DeviceCMYK'),
      spotColorDict,
    ]);
    
    // Register the color space
    const spotColorRef = pdfContext.register(spotColorSpace);
    
    // Add resources to the page
    const resources = page.node.Resources();
    if (!resources) {
      throw new Error('Could not access page resources');
    }
    
    // Get or create ColorSpace dictionary
    let colorSpaceDict = resources.get(PDFName.of('ColorSpace'));
    if (!colorSpaceDict) {
      colorSpaceDict = pdfContext.obj({});
      resources.set(PDFName.of('ColorSpace'), colorSpaceDict);
    }
    
    // Set the spot color in the ColorSpace dictionary
    if (colorSpaceDict) {
      (colorSpaceDict as any).set(PDFName.of('CS1'), spotColorRef);
    }
    
    // Add ExtGState with standard print settings
    const gsDict = pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      ca: PDFNumber.of(1),  // non-stroke alpha
      CA: PDFNumber.of(1),  // stroke alpha
      LW: PDFNumber.of(0.5), // Line width - standard for cut paths
    });
    const gsRef = pdfContext.register(gsDict);
    
    // Get or create ExtGState dictionary
    let extGState = resources.get(PDFName.of('ExtGState'));
    if (!extGState) {
      extGState = pdfContext.obj({});
      resources.set(PDFName.of('ExtGState'), extGState);
    }
    
    // Set the graphics state
    if (extGState) {
      (extGState as any).set(PDFName.of('GS1'), gsRef);
    }
    
    // Define cut contour path data - exact dimensions with correct offset
    const pathData = createCutContourPath(
      imgDims.width + (bleedPt * 2), 
      imgDims.height + (bleedPt * 2), 
      settings.cutContourOffset
    );
    
    // Add named CutContour to content stream using standard PDF operators
    // Using stroke-only path with 100% magenta
    const contentStream = pdfContext.stream(`
      /CS1 CS
      /CS1 cs
      1 0 0 RG
      1 0 0 rg
      0.5 w
      /GS1 gs
      ${pathData} s
    `);
    
    // Get current content streams
    const currentContents = page.node.Contents();
    let contentArray;
    
    if (currentContents instanceof PDFArray) {
      contentArray = currentContents;
    } else {
      contentArray = pdfContext.obj([]);
      if (currentContents) {
        contentArray.push(currentContents);
      }
    }
    
    // Add new content stream with the CutContour path
    const contentStreamRef = pdfContext.register(contentStream);
    contentArray.push(contentStreamRef);
    page.node.set(PDFName.of('Contents'), contentArray);
    
    // Get file name from URL for metadata
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    
    // Set PDF metadata using standard methods
    pdfDoc.setTitle(`${fileName}_CutContour`);
    pdfDoc.setCreator('Adobe Illustrator Compatible CutContour Tool');
    pdfDoc.setProducer('Adobe PDF library 17.00');
    pdfDoc.setSubject('PDF/X-3:2002');
    
    // Add PDF/X-3:2002 compatibility metadata
    const catalogDict = pdfDoc.catalog;
    
    // Add OutputIntents for PDF/X compatibility
    const outputIntentDict = pdfContext.obj({
      Type: PDFName.of('OutputIntent'),
      S: PDFName.of('GTS_PDFX'),
      OutputConditionIdentifier: PDFString.of('PDF/X-3:2002'),
      RegistryName: PDFString.of('http://www.color.org'),
    });
    const outputIntents = pdfContext.obj([outputIntentDict]);
    catalogDict.set(PDFName.of('OutputIntents'), outputIntents);
    
    // Add MarkInfo for Illustrator compatibility
    const markInfoDict = pdfContext.obj({
      Marked: true,
      UserProperties: false,
      Suspects: false
    });
    catalogDict.set(PDFName.of('MarkInfo'), markInfoDict);
    
    // Add Trapped value
    const info = pdfDoc.context.obj({
      Trapped: PDFName.of('False')
    }) as PDFDict;
    
    // Override info dictionary directly
    const infoRef = pdfDoc.context.register(info);
    pdfDoc.context.trailerInfo.Info = infoRef;
    
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

// Helper function to convert ArrayBuffer to Base64 without using Buffer (browser-compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(buffer))
    .map(b => String.fromCharCode(b))
    .join('');
  return btoa(binary);
}
