/**
 * PDF Creator - VEREINFACHT!
 *
 * Erstellt PDF mit Cut-Kontur OHNE Farbraum-Konvertierung.
 * Das Original-PDF/Bild wird durchgereicht (RGB bleibt RGB, CMYK bleibt CMYK).
 *
 * Philosophie: "Wie Photoshop" - Keine automatische Konvertierung!
 */

import { PDFDocument } from 'pdf-lib';
import { optimizeImageIfNeeded } from '../fileValidationUtils';
import { ProgressTracker } from '../progressUtils';
import { setPdfMetadata } from './pdfMetadataUtils';
import { createCutContour } from './cutContourCreator';

// Vereinfachte Settings - NUR das Nötigste!
export type PDFCreatorSettings = {
  cutContourOffset: number;
  spotColorName: string;
};

/**
 * Erstellt PDF mit Cut-Kontur aus Bild
 *
 * WICHTIG: KEINE Farbraum-Konvertierung!
 * Das Bild wird im Original-Farbraum eingebettet.
 */
export const createPdfWithCutContour = async (
  imageUrl: string,
  settings: PDFCreatorSettings,
  onProgress?: (progress: number, status: string) => void
) => {
  const progress = onProgress
    ? new ProgressTracker(onProgress)
    : {
        setProgress: () => {},
        incrementProgress: () => {},
        complete: () => {}
      };

  try {
    console.log('[createPdfWithCutContour] Starting PDF creation (NO conversion)');
    console.log('[createPdfWithCutContour] Settings:', settings);

    progress.setProgress('LOADING_IMAGE', 'Lade Bild...');

    // Bild optimieren falls nötig
    const optimizedImageUrl = await optimizeImageIfNeeded(imageUrl);
    if (optimizedImageUrl !== imageUrl) {
      console.log('[createPdfWithCutContour] Image optimized for performance');
    }

    // Bild laden
    const img = document.createElement('img');

    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      img.crossOrigin = "anonymous";
      img.src = optimizedImageUrl;
    });

    progress.incrementProgress(5, 'Bild wird geladen...');

    const loadedImg = await Promise.race([
      imageLoadPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung beim Laden des Bildes')), 30000)
      )
    ]);

    console.log(`[createPdfWithCutContour] Image loaded: ${img.naturalWidth}x${img.naturalHeight}px`);
    progress.incrementProgress(5, 'Bild geladen');

    // PDF-Dokument erstellen
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false
    });

    progress.setProgress('PROCESSING_IMAGE', 'Verarbeite Bild...');

    // Bilddaten abrufen
    const imageData = await fetchImageData(optimizedImageUrl);
    if (!imageData) {
      throw new Error("Keine Bilddaten verfügbar");
    }

    progress.incrementProgress(10, 'PDF wird erstellt...');

    // Bild in PDF einbetten - OHNE KONVERTIERUNG!
    // pdf-lib bettet das Bild im Original-Farbraum ein
    console.log('[createPdfWithCutContour] Embedding image (original color space preserved)');

    let embeddedImage;
    try {
      embeddedImage = await pdfDoc.embedJpg(imageData);
    } catch (jpgError) {
      console.warn('[createPdfWithCutContour] JPG embedding failed, trying PNG:', jpgError);
      embeddedImage = await pdfDoc.embedPng(imageData);
    }

    progress.incrementProgress(5, 'Bild in PDF eingebettet');

    // Bildabmessungen berechnen
    const pixelWidth = img.naturalWidth;
    const pixelHeight = img.naturalHeight;

    // DPI erkennen (Standard: 72 DPI für Web-Bilder)
    const imageDPI = 72;

    console.log(`[createPdfWithCutContour] Image: ${pixelWidth}x${pixelHeight}px @ ${imageDPI}dpi`);

    // Physikalische Abmessungen berechnen
    const widthInInches = pixelWidth / imageDPI;
    const heightInInches = pixelHeight / imageDPI;

    // In PDF-Punkte umrechnen (72 Punkte = 1 Zoll)
    const pdfPageWidth = widthInInches * 72;
    const pdfPageHeight = heightInInches * 72;

    // In cm für Anzeige
    const widthInCm = widthInInches * 2.54;
    const heightInCm = heightInInches * 2.54;

    console.log(`[createPdfWithCutContour] Physical size: ${widthInCm.toFixed(2)}x${heightInCm.toFixed(2)}cm`);
    console.log(`[createPdfWithCutContour] PDF size: ${pdfPageWidth.toFixed(2)}x${pdfPageHeight.toFixed(2)}pt`);

    // Seite erstellen
    console.log('[createPdfWithCutContour] Creating PDF page');
    const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);

    progress.setProgress('CREATING_PDF', 'Erstelle PDF mit CutContour...');

    // Bild in voller Größe einzeichnen
    console.log('[createPdfWithCutContour] Drawing image on page');
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pdfPageWidth,
      height: pdfPageHeight,
    });

    const pdfContext = pdfDoc.context;
    const spotColorName = settings.spotColorName || "CutContour";

    // Cut-Kontur hinzufügen
    console.log('[createPdfWithCutContour] Adding cut contour');
    await createCutContour({
      page,
      pdfContext,
      pdfPageWidth,
      pdfPageHeight,
      spotColorName,
      cutContourOffset: settings.cutContourOffset,
      progress
    });

    // Dateiname für Metadaten
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';
    const fileNameWithDimensions = `${fileName}_${widthInCm.toFixed(1)}x${heightInCm.toFixed(1)}cm`;

    console.log('[createPdfWithCutContour] Setting PDF metadata');
    setPdfMetadata(pdfDoc, fileNameWithDimensions);

    progress.incrementProgress(10, 'PDF wird finalisiert...');

    // PDF speichern
    console.log('[createPdfWithCutContour] Saving PDF document');

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 100,
      updateFieldAppearances: false,
    });

    console.log(`[createPdfWithCutContour] SUCCESS! PDF created: ${pdfBytes.byteLength} bytes`);

    progress.setProgress('FINALIZING', 'PDF wird fertiggestellt...');

    // Blob URL erstellen
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);

    progress.complete('PDF fertiggestellt');

    return pdfUrl;
  } catch (error) {
    console.error('[createPdfWithCutContour] ERROR:', error);
    progress.complete('Fehler bei der PDF-Erstellung');
    throw new Error(`PDF-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};

/**
 * Bilddaten abrufen
 */
const fetchImageData = async (imageUrl: string): Promise<ArrayBuffer> => {
  try {
    console.log('[fetchImageData] Fetching image data from URL');

    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      return await response.arrayBuffer();
    }

    // Für andere URLs
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('[fetchImageData] ERROR:', error);
    throw new Error(`Fehler beim Laden der Bilddaten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};
