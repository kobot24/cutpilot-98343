
import { PDFDocument, PDFName, PDFDict, PDFContext, PDFString, PDFArray, PDFNumber, PDFHexString, PDFBool, PDFStream } from 'pdf-lib';

// Set standard PDF metadata for print workflows
export const setPdfMetadata = (pdfDoc: PDFDocument, fileName: string, spotColorName: string) => {
  // Set PDF metadata using standard methods and include explicit spot color references
  pdfDoc.setTitle(`${fileName}_${spotColorName}`);
  pdfDoc.setCreator('Adobe Illustrator 25.0 Compatible');
  pdfDoc.setProducer('PDF/X-3 Generator with ' + spotColorName);
  pdfDoc.setSubject('PDF/X-3:2002 with ' + spotColorName);
  
  // Set the exact XMP metadata required for proper Illustrator compatibility
  const xmpMetadata = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 9.1-c003 1.000000, 0000/00/00-00:00:00        ">
   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
            xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
         <pdf:Trapped>False</pdf:Trapped>
      </rdf:Description>
      <rdf:Description rdf:about=""
            xmlns:xmp="http://ns.adobe.com/xap/1.0/">
         <xmp:CreatorTool>Adobe Illustrator 25.0 (Macintosh)</xmp:CreatorTool>
         <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
         <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
         <xmp:MetadataDate>${new Date().toISOString()}</xmp:MetadataDate>
      </rdf:Description>
      <rdf:Description rdf:about=""
            xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/">
         <xmpMM:DocumentID>urn:uuid:${generateUUID()}</xmpMM:DocumentID>
         <xmpMM:InstanceID>urn:uuid:${generateUUID()}</xmpMM:InstanceID>
      </rdf:Description>
      <rdf:Description rdf:about=""
            xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/">
         <pdfx:SpotColors>${spotColorName}</pdfx:SpotColors>
      </rdf:Description>
   </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  
  // Create metadata stream
  const metadataStream = pdfDoc.context.stream(xmpMetadata);
  
  // Register metadata with proper structure
  const metadata = pdfDoc.context.obj({
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
    Length: PDFNumber.of(xmpMetadata.length)
  });
  
  // Add stream to metadata object
  (metadata as PDFDict).set(PDFName.of('Length'), PDFNumber.of(xmpMetadata.length));
  metadata.set(PDFName.from('Stream'), metadataStream);
  
  // Register and add to catalog
  const metadataRef = pdfDoc.context.register(metadata);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);
};

// Add PDF/X compatibility info to the document
export const addPdfXCompatibility = (pdfDoc: PDFDocument, pdfContext: PDFContext, spotColorName: string) => {
  const catalogDict = pdfDoc.catalog;
  
  // Add OutputIntents for PDF/X compatibility
  const outputIntentDict = pdfContext.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFX'),
    OutputCondition: PDFString.of('CGATS TR 001'),
    OutputConditionIdentifier: PDFString.of('PDF/X-3:2002'),
    RegistryName: PDFString.of('http://www.color.org'),
    DestOutputProfile: null,
    Info: PDFString.of(`PDF/X-3 with ${spotColorName} spot color`)
  });
  const outputIntents = pdfContext.obj([outputIntentDict]);
  catalogDict.set(PDFName.of('OutputIntents'), outputIntents);
  
  // Add MarkInfo for Illustrator compatibility
  const markInfoDict = pdfContext.obj({
    Marked: PDFBool.of(true),
    UserProperties: PDFBool.of(false),
    Suspects: PDFBool.of(false)
  });
  catalogDict.set(PDFName.of('MarkInfo'), markInfoDict);
  
  // Add Illustrator-specific spot color information
  const spotColorInfo = pdfContext.obj({
    Name: PDFName.of(spotColorName),
    AlternateColorSpace: PDFName.of('DeviceCMYK'),
    Components: pdfContext.obj([
      PDFNumber.of(0),  // C
      PDFNumber.of(1),  // M (100%)
      PDFNumber.of(0),  // Y
      PDFNumber.of(0)   // K
    ]),
    ColorantName: PDFString.of(spotColorName),
    Colorants: pdfContext.obj([
      PDFString.of(spotColorName)
    ]),
    SpotColorUsed: PDFBool.of(true)
  });
  catalogDict.set(PDFName.of('SpotColorInfo'), spotColorInfo);
  
  // Set SpotColors dictionary with the exact spot color name
  const spotDict = pdfContext.obj({
    SpotColorUsed: PDFBool.of(true),
    Names: pdfContext.obj([PDFString.of(spotColorName)]),
    ColorSpace: PDFName.of('DeviceCMYK'),
    Separation: PDFBool.of(true),
    SpotColorName: PDFString.of(spotColorName)
  });
  catalogDict.set(PDFName.of('SpotColors'), spotDict);
  
  // Add PDF/X version identifier
  catalogDict.set(PDFName.of('GTS_PDFXVersion'), PDFString.of('PDF/X-3:2002'));
  
  // Set Adobe-specific trapped value
  const info = pdfContext.obj({
    Trapped: PDFName.of('False'),
    CreatorVersion: PDFString.of('25.0.0'),
    HasSpotColors: PDFBool.of(true),
    SpotColorNames: pdfContext.obj([PDFString.of(spotColorName)])
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

// Helper function to generate UUID for PDF metadata
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
