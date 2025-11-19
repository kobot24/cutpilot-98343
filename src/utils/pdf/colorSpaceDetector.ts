/**
 * PDF Color Space Detector
 *
 * Erkennt den Farbraum von PDF-Dateien und Bildern.
 * Zeigt an: RGB, CMYK, Grayscale, oder Mixed
 */

import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';

export type ColorSpace = 'RGB' | 'CMYK' | 'Gray' | 'Mixed' | 'Unknown';

export interface ColorSpaceInfo {
  colorSpace: ColorSpace;
  details: {
    hasRGB: boolean;
    hasCMYK: boolean;
    hasGray: boolean;
    imageCount: number;
  };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Erkennt Farbraum eines PDFs
 *
 * @param pdfBytes - PDF als ArrayBuffer oder Uint8Array
 * @returns ColorSpaceInfo mit erkanntem Farbraum
 */
export async function detectPDFColorSpace(
  pdfBytes: ArrayBuffer | Uint8Array
): Promise<ColorSpaceInfo> {
  try {
    console.log('[detectPDFColorSpace] Analyzing PDF color space...');

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    let hasRGB = false;
    let hasCMYK = false;
    let hasGray = false;
    let imageCount = 0;

    // Analysiere jede Seite
    for (const page of pages) {
      try {
        const resources = page.node.Resources();
        if (!resources) continue;

        // XObject (Images) analysieren
        const xObjectDict = resources.lookup(PDFName.of('XObject'));
        if (xObjectDict instanceof PDFDict) {
          const xObjectKeys = xObjectDict.keys();

          for (const key of xObjectKeys) {
            try {
              const xObject = xObjectDict.lookup(key);
              if (!xObject || !(xObject instanceof PDFDict)) continue;

              // Prüfe ob es ein Image ist
              const subtype = xObject.lookup(PDFName.of('Subtype'));
              if (subtype?.toString() !== '/Image') continue;

              imageCount++;

              // ColorSpace auslesen
              const colorSpace = xObject.lookup(PDFName.of('ColorSpace'));
              if (!colorSpace) continue;

              const colorSpaceStr = colorSpace.toString();
              console.log(`[detectPDFColorSpace] Found image with ColorSpace: ${colorSpaceStr}`);

              // Farbraum erkennen
              if (colorSpaceStr.includes('DeviceRGB') || colorSpaceStr.includes('RGB')) {
                hasRGB = true;
              } else if (colorSpaceStr.includes('DeviceCMYK') || colorSpaceStr.includes('CMYK')) {
                hasCMYK = true;
              } else if (colorSpaceStr.includes('DeviceGray') || colorSpaceStr.includes('Gray')) {
                hasGray = true;
              } else if (colorSpace instanceof PDFArray) {
                // Array ColorSpace (z.B. [/ICCBased ...])
                const firstElement = colorSpace.get(0);
                const firstStr = firstElement?.toString() || '';

                if (firstStr.includes('ICCBased')) {
                  // ICC-basiert - versuche Komponenten zu zählen
                  // 1 = Gray, 3 = RGB, 4 = CMYK
                  const stream = colorSpace.get(1);
                  if (stream && stream instanceof PDFDict) {
                    const n = stream.lookup(PDFName.of('N'));
                    const nValue = n?.toString();

                    if (nValue === '1') hasGray = true;
                    else if (nValue === '3') hasRGB = true;
                    else if (nValue === '4') hasCMYK = true;
                  }
                } else if (firstStr.includes('CalRGB')) {
                  hasRGB = true;
                } else if (firstStr.includes('CalGray')) {
                  hasGray = true;
                }
              }
            } catch (imageError) {
              console.warn('[detectPDFColorSpace] Error analyzing image:', imageError);
            }
          }
        }

        // ColorSpace direkt in Page Resources
        const colorSpaceDict = resources.lookup(PDFName.of('ColorSpace'));
        if (colorSpaceDict instanceof PDFDict) {
          const keys = colorSpaceDict.keys();
          for (const key of keys) {
            const cs = colorSpaceDict.lookup(key);
            const csStr = cs?.toString() || '';

            if (csStr.includes('CMYK')) hasCMYK = true;
            if (csStr.includes('RGB')) hasRGB = true;
            if (csStr.includes('Gray')) hasGray = true;
          }
        }
      } catch (pageError) {
        console.warn('[detectPDFColorSpace] Error analyzing page:', pageError);
      }
    }

    console.log(`[detectPDFColorSpace] Analysis complete: RGB=${hasRGB}, CMYK=${hasCMYK}, Gray=${hasGray}, Images=${imageCount}`);

    // Farbraum bestimmen
    let colorSpace: ColorSpace;
    let confidence: 'high' | 'medium' | 'low';

    const colorCount = [hasRGB, hasCMYK, hasGray].filter(Boolean).length;

    if (colorCount === 0) {
      colorSpace = 'Unknown';
      confidence = 'low';
    } else if (colorCount > 1) {
      colorSpace = 'Mixed';
      confidence = 'medium';
    } else {
      // Nur ein Farbraum gefunden
      if (hasCMYK) {
        colorSpace = 'CMYK';
        confidence = 'high';
      } else if (hasRGB) {
        colorSpace = 'RGB';
        confidence = 'high';
      } else {
        colorSpace = 'Gray';
        confidence = 'high';
      }
    }

    return {
      colorSpace,
      details: {
        hasRGB,
        hasCMYK,
        hasGray,
        imageCount
      },
      confidence
    };
  } catch (error) {
    console.error('[detectPDFColorSpace] ERROR:', error);

    // Fallback: Unknown
    return {
      colorSpace: 'Unknown',
      details: {
        hasRGB: false,
        hasCMYK: false,
        hasGray: false,
        imageCount: 0
      },
      confidence: 'low'
    };
  }
}

/**
 * Erkennt Farbraum eines Bildes (heuristisch)
 *
 * Hinweis: Bilder im Browser sind immer RGB!
 * Diese Funktion ist nur eine Heuristik.
 */
export async function detectImageColorSpace(
  imageUrl: string
): Promise<ColorSpaceInfo> {
  try {
    console.log('[detectImageColorSpace] Analyzing image...');

    // Bilder im Browser sind IMMER RGB
    // CMYK-Bilder werden vom Browser automatisch zu RGB konvertiert

    return {
      colorSpace: 'RGB',
      details: {
        hasRGB: true,
        hasCMYK: false,
        hasGray: false,
        imageCount: 1
      },
      confidence: 'high'
    };
  } catch (error) {
    console.error('[detectImageColorSpace] ERROR:', error);

    return {
      colorSpace: 'Unknown',
      details: {
        hasRGB: false,
        hasCMYK: false,
        hasGray: false,
        imageCount: 0
      },
      confidence: 'low'
    };
  }
}

/**
 * Gibt menschenlesbaren Farbraum-Namen zurück
 */
export function getColorSpaceLabel(colorSpace: ColorSpace): string {
  switch (colorSpace) {
    case 'RGB':
      return 'RGB';
    case 'CMYK':
      return 'CMYK';
    case 'Gray':
      return 'Graustufen';
    case 'Mixed':
      return 'Gemischt';
    default:
      return 'Unbekannt';
  }
}

/**
 * Gibt Farbe für Badge zurück
 */
export function getColorSpaceBadgeColor(colorSpace: ColorSpace): 'green' | 'blue' | 'gray' | 'yellow' | 'red' {
  switch (colorSpace) {
    case 'CMYK':
      return 'green'; // Druckerei-ready!
    case 'RGB':
      return 'blue';
    case 'Gray':
      return 'gray';
    case 'Mixed':
      return 'yellow';
    default:
      return 'red';
  }
}

/**
 * Gibt Icon/Emoji für Farbraum zurück
 */
export function getColorSpaceIcon(colorSpace: ColorSpace): string {
  switch (colorSpace) {
    case 'CMYK':
      return '🟢'; // Grün = Print-ready
    case 'RGB':
      return '🔵'; // Blau = Screen
    case 'Gray':
      return '⚫'; // Schwarz = Grayscale
    case 'Mixed':
      return '🟡'; // Gelb = Gemischt
    default:
      return '❓'; // Unbekannt
  }
}
