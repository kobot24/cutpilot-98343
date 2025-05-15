
import { PDFDocument, PDFName, PDFDict, PDFContext, PDFString, PDFArray } from 'pdf-lib';

// Set standard PDF metadata for print workflows
export const setPdfMetadata = (pdfDoc: PDFDocument, fileName: string) => {
  // Set PDF metadata using standard methods
  pdfDoc.setTitle(`${fileName}_CutContour`);
  pdfDoc.setCreator('Adobe Illustrator Compatible CutContour Tool');
  pdfDoc.setProducer('Adobe PDF library 17.00');
  pdfDoc.setSubject('PDF/X-3:2002');
};

// Add PDF/X compatibility info to the document
export const addPdfXCompatibility = (pdfDoc: PDFDocument, pdfContext: PDFContext) => {
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
