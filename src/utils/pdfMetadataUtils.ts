
import { PDFDocument, PDFName, PDFDict, PDFContext, PDFString, PDFArray, PDFNumber, PDFHexString } from 'pdf-lib';

// Set standard PDF metadata for print workflows
export const setPdfMetadata = (pdfDoc: PDFDocument, fileName: string) => {
  // Set PDF metadata using standard methods and include explicit CutContour references
  pdfDoc.setTitle(`${fileName}_CutContour`);
  pdfDoc.setCreator('Adobe Illustrator 25.0 Compatible');
  pdfDoc.setProducer('PDF-X3 Generator with CutContour');
  pdfDoc.setSubject('PDF/X-3:2002 with CutContour');
  
  // Advanced metadata for Print Production
  const metadata = pdfDoc.context.obj({
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
    CreatorTool: PDFString.of('Adobe Illustrator 25.0'),
    PDFXVersion: PDFString.of('PDF/X-3:2002'),
    GTS_PDFXConformance: PDFString.of('PDF/X-3:2002'),
    ContainsSpotColors: true
  });
  
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadata);
};

// Add PDF/X compatibility info to the document
export const addPdfXCompatibility = (pdfDoc: PDFDocument, pdfContext: PDFContext) => {
  const catalogDict = pdfDoc.catalog;
  
  // Add OutputIntents for PDF/X compatibility with more detailed color intent
  const outputIntentDict = pdfContext.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFX'),
    OutputCondition: PDFString.of('CGATS TR 001'),
    OutputConditionIdentifier: PDFString.of('PDF/X-3:2002'),
    RegistryName: PDFString.of('http://www.color.org'),
    DestOutputProfile: null,
    Info: PDFString.of('PDF/X-3 with CutContour spot color')
  });
  const outputIntents = pdfContext.obj([outputIntentDict]);
  catalogDict.set(PDFName.of('OutputIntents'), outputIntents);
  
  // Add MarkInfo for Illustrator compatibility - critical for spot color recognition
  const markInfoDict = pdfContext.obj({
    Marked: true,
    UserProperties: false,
    Suspects: false
  });
  catalogDict.set(PDFName.of('MarkInfo'), markInfoDict);
  
  // Add Illustrator-specific metadata with explicit version
  const aiMetadata = pdfContext.obj({
    AIMetaData: pdfContext.obj({
      AIVersion: PDFString.of('25.0'),
      ContainsXMP: true,
      SpotColors: pdfContext.obj([PDFString.of('CutContour')])
    }),
    AIPrivateData: pdfContext.obj([1]),
    ContainsXMP: PDFName.of('true')
  });
  catalogDict.set(PDFName.of('AdobeIllustratorData'), aiMetadata);
  
  // Add PDF/X version identifier
  catalogDict.set(PDFName.of('GTS_PDFXVersion'), PDFString.of('PDF/X-3:2002'));
  
  // Set SpotColors dictionary
  const spotDict = pdfContext.obj({
    SpotColorUsed: true,
    Names: pdfContext.obj([PDFString.of('CutContour')]),
    ColorSpace: PDFName.of('DeviceCMYK'),
    Separation: true
  });
  catalogDict.set(PDFName.of('SpotColors'), spotDict);
  
  // Add Trapped value and spot color reference
  const info = pdfContext.obj({
    Trapped: PDFName.of('False'),
    CreatorVersion: PDFString.of('25.0.0'),
    HasSpotColors: true,
    SpotColorNames: pdfContext.obj([PDFString.of('CutContour')])
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
