
import { PDFDocument, PDFName, PDFDict, PDFContext, PDFString, PDFArray } from 'pdf-lib';

// Set standard PDF metadata for print workflows
export const setPdfMetadata = (pdfDoc: PDFDocument, fileName: string) => {
  // Set PDF metadata using standard methods
  pdfDoc.setTitle(`${fileName}_CutContour`);
  pdfDoc.setCreator('Adobe Illustrator Compatible CutContour Tool');
  pdfDoc.setProducer('Adobe PDF library 17.00');
  pdfDoc.setSubject('PDF/X-3:2002');
};

// Unified function to add all metadata
export const addPdfMetadata = (
  pdfDoc: PDFDocument,
  pdfContext: PDFContext,
  fileName: string,
  skipOutputIntents: boolean = false
) => {
  // Set basic metadata
  setPdfMetadata(pdfDoc, fileName);

  // Add PDF/X compatibility (skip OutputIntents if ICC profile was already embedded)
  addPdfXCompatibility(pdfDoc, pdfContext, skipOutputIntents);
};

// Add PDF/X compatibility info to the document
export const addPdfXCompatibility = (
  pdfDoc: PDFDocument,
  pdfContext: PDFContext,
  skipOutputIntents: boolean = false
) => {
  const catalogDict = pdfDoc.catalog;

  // Add OutputIntents for PDF/X compatibility (unless already set by ICC profile embedding)
  if (!skipOutputIntents) {
    const outputIntentDict = pdfContext.obj({
      Type: PDFName.of('OutputIntent'),
      S: PDFName.of('GTS_PDFX'),
      OutputConditionIdentifier: PDFString.of('PDF/X-3:2002'),
      RegistryName: PDFString.of('http://www.color.org'),
    });
    const outputIntents = pdfContext.obj([outputIntentDict]);
    catalogDict.set(PDFName.of('OutputIntents'), outputIntents);
  }
  
  // Add MarkInfo for Illustrator compatibility
  const markInfoDict = pdfContext.obj({
    Marked: true,
    UserProperties: false,
    Suspects: false
  });
  catalogDict.set(PDFName.of('MarkInfo'), markInfoDict);
  
  // Add Illustrator-specific metadata
  const aiMetadata = pdfContext.obj({
    AIMetaData: pdfContext.obj({
      AIVersion: PDFString.of('25.0'),
      ContainsXMP: true
    }),
    AIPrivateData: pdfContext.obj([1]),
    ContainsXMP: PDFName.of('true')
  });
  catalogDict.set(PDFName.of('AdobeIllustratorData'), aiMetadata);
  
  // Add Trapped value
  const info = pdfContext.obj({
    Trapped: PDFName.of('False')
  }) as PDFDict;
  
  // Override info dictionary directly
  const infoRef = pdfContext.register(info);
  pdfContext.trailerInfo.Info = infoRef;
};

// Helper function to convert ArrayBuffer to Base64 without using Buffer (browser-compatible)
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const binary = Array.from(new Uint8Array(buffer))
    .map(b => String.fromCharCode(b))
    .join('');
  return btoa(binary);
};

// Helper function to convert Base64 to Uint8Array
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Embed an ICC profile into the PDF for color management
 * This ensures that the PDF is displayed and printed with the correct colors
 */
export const embedICCProfile = (
  pdfDoc: PDFDocument,
  pdfContext: PDFContext,
  iccProfileBase64: string,
  colorSpace: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray',
  profileName: string = 'ICC Profile'
): void => {
  try {
    console.log(`Embedding ICC profile for ${colorSpace}`);

    // Convert Base64 ICC profile to Uint8Array
    const iccProfileData = base64ToUint8Array(iccProfileBase64);

    // Create a stream object for the ICC profile
    const iccStream = pdfContext.stream(iccProfileData, {
      Type: PDFName.of('Metadata'),
      Subtype: PDFName.of('XML'),
    });

    // Register the stream in the context
    const iccStreamRef = pdfContext.register(iccStream);

    // Determine the number of color components based on color space
    let numComponents = 3; // RGB default
    if (colorSpace === 'DeviceCMYK') {
      numComponents = 4;
    } else if (colorSpace === 'DeviceGray') {
      numComponents = 1;
    }

    // Create ICCBased color space array
    const iccColorSpace = pdfContext.obj([
      PDFName.of('ICCBased'),
      iccStreamRef,
    ]);

    // Add N (number of components) to the ICC stream dictionary
    iccStream.dict.set(PDFName.of('N'), pdfContext.obj(numComponents));

    // Update the OutputIntent with the ICC profile
    const catalogDict = pdfDoc.catalog;
    const outputIntentDict = pdfContext.obj({
      Type: PDFName.of('OutputIntent'),
      S: PDFName.of('GTS_PDFX'),
      OutputConditionIdentifier: PDFString.of(profileName),
      RegistryName: PDFString.of('http://www.color.org'),
      DestOutputProfile: iccStreamRef,
    });

    const outputIntents = pdfContext.obj([outputIntentDict]);
    catalogDict.set(PDFName.of('OutputIntents'), outputIntents);

    console.log('ICC profile successfully embedded');
  } catch (error) {
    console.error('Error embedding ICC profile:', error);
    // Don't throw - fall back to standard PDF/X without custom ICC profile
    console.warn('Continuing without custom ICC profile');
  }
};
