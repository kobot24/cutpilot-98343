
import { PDFDocument, PDFName, PDFArray, PDFNumber } from 'pdf-lib';

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

    // Create PDF document with compatible options
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false // Don't add default metadata that might cause issues
    });
    
    // Add image to PDF
    const jpgImage = await pdfDoc.embedJpg(await fetch(imageUrl).then(r => r.arrayBuffer()));
    const imgDims = jpgImage.scale(1);

    // Create page slightly larger than the image
    const page = pdfDoc.addPage([
      imgDims.width + 40,
      imgDims.height + 40
    ]);
    
    // Place image centered on the page
    page.drawImage(jpgImage, {
      x: 20,
      y: 20,
      width: imgDims.width,
      height: imgDims.height,
    });
    
    // Create a spot color with better compatibility
    const spotColorName = settings.spotColorName || 'CutContour';
    const pdfContext = pdfDoc.context;
    
    // Create a more standard Separation color space for better compatibility
    const spotColorDict = pdfContext.obj({
      FunctionType: 2,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1],
      C0: [0, 0, 0], // RGB Black
      C1: [1, 0, 1], // RGB Magenta
      N: 1, // Linear interpolation
    });
    
    const spotColorSpace = pdfContext.obj([
      PDFName.of('Separation'),
      PDFName.of(spotColorName),
      PDFName.of('DeviceRGB'),
      spotColorDict,
    ]);
    
    // Register the color space in the PDF document
    const spotColorRef = pdfDoc.context.register(spotColorSpace);
    
    // Add resources to the page
    const resources = page.node.Resources();
    if (!resources) {
      throw new Error('Could not access page resources');
    }
    
    // Get or create ColorSpace dictionary - better error handling
    let colorSpaceDict = resources.get(PDFName.of('ColorSpace'));
    if (!colorSpaceDict) {
      colorSpaceDict = pdfContext.obj({});
      resources.set(PDFName.of('ColorSpace'), colorSpaceDict);
    }
    
    // Set the spot color in the ColorSpace dictionary with compatible method
    if (colorSpaceDict) {
      // Use type assertion to fix the TypeScript error
      (colorSpaceDict as any).set(PDFName.of('CS1'), spotColorRef);
    }
    
    // Add standard ExtGState with opacity settings
    const gsDict = pdfContext.obj({
      Type: PDFName.of('ExtGState'),
      ca: PDFNumber.of(1),
      CA: PDFNumber.of(1),
      LW: PDFNumber.of(1), // Line width
    });
    const gsRef = pdfContext.register(gsDict);
    
    // Get or create ExtGState dictionary
    let extGState = resources.get(PDFName.of('ExtGState'));
    if (!extGState) {
      extGState = pdfContext.obj({});
      resources.set(PDFName.of('ExtGState'), extGState);
    }
    
    // Set the graphics state in the ExtGState dictionary
    if (extGState) {
      // Use type assertion to fix the TypeScript error
      (extGState as any).set(PDFName.of('GS1'), gsRef);
    }
    
    // Define cut contour path data
    const pathData = createCutContourPath(imgDims.width + 40, imgDims.height + 40, settings.cutContourOffset);
    
    // Add cutContour to content stream using more compatible PDF operators
    const contentStream = pdfContext.stream(`
      /CS1 CS
      /CS1 cs
      1 0 0 RG
      1 0 0 rg
      1 w
      /GS1 gs
      ${pathData} S
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
    
    // Add new content stream
    const contentStreamRef = pdfContext.register(contentStream);
    contentArray.push(contentStreamRef);
    page.node.set(PDFName.of('Contents'), contentArray);
    
    // Add standard PDF metadata
    pdfDoc.setTitle(`CutContour - ${new Date().toISOString()}`);
    pdfDoc.setCreator('Web CutContour Tool');
    pdfDoc.setProducer('PDF-Lib');
    
    // Save PDF as base64 with better compression settings
    const pdfBytes = await pdfDoc.save({ 
      useObjectStreams: false, // Better compatibility with older PDF readers
      addDefaultPage: false
    });
    
    // Convert to base64 without using Buffer (which may not be available in browser)
    const uint8Array = new Uint8Array(pdfBytes);
    const base64String = btoa(
      Array.from(uint8Array)
        .map(b => String.fromCharCode(b))
        .join('')
    );
    
    return `data:application/pdf;base64,${base64String}`;
  } catch (error) {
    console.error('Error creating PDF with cut contour:', error);
    throw new Error(`PDF-Erstellung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
  }
};
