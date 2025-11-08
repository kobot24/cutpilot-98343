
import { PDFDocument } from 'pdf-lib';
import { optimizeImageIfNeeded } from '../fileValidationUtils';
import { ProgressTracker } from '../progressUtils';
import { FILE_STORAGE_LIMITS } from '../../constants/fileStorage';
import { addPdfMetadata, embedICCProfile } from './pdfMetadataUtils';
import { createCutContour } from './cutContourCreator';
import { detectImageColorSpace, convertImageColorSpace } from './colorSpaceUtils';

// Extended settings type to include ICC profile and color space settings
export type PDFCreatorSettings = {
  cutContourOffset: number;
  spotColorName: string;
  convertColorSpace?: boolean;
  targetColorSpace?: 'DeviceCMYK' | 'DeviceRGB' | 'DeviceGray';
  defaultICCProfile?: string | null;
  iccProfileData?: string | null; // Base64 encoded ICC profile data
};

// Create PDF with cut contour from image URL
export const createPdfWithCutContour = async (
  imageUrl: string,
  settings: PDFCreatorSettings,
  onProgress?: (progress: number, status: string) => void
) => {
  // Initialize progress tracking if callback provided
  const progress = onProgress 
    ? new ProgressTracker(onProgress) 
    : { 
        setProgress: () => {}, 
        incrementProgress: () => {}, 
        complete: () => {} 
      };
  
  try {
    console.log('Starting PDF creation process');
    console.log('Settings:', settings);
    
    progress.setProgress('LOADING_IMAGE', 'Lade Bild...');
    
    // Für sehr große Bilder zuerst optimieren
    console.log('Optimiere Bild wenn nötig...');
    const optimizedImageUrl = await optimizeImageIfNeeded(imageUrl);
    if (optimizedImageUrl !== imageUrl) {
      console.log('Bild wurde für bessere Performance optimiert');
    }
    
    // Image-Element erstellen, um Dimensionen zu erhalten
    const img = document.createElement('img');
    
    // Promise erstellen, um auf das Laden des Bildes zu warten
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      
      // crossOrigin auf anonymous setzen, um CORS-Probleme mit Daten-URLs zu vermeiden
      img.crossOrigin = "anonymous";
      img.src = optimizedImageUrl;
    });
    
    progress.incrementProgress(5, 'Bild wird geladen...');
    
    // Auf das Laden des Bildes mit einem Timeout warten
    const loadedImg = await Promise.race([
      imageLoadPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Zeitüberschreitung beim Laden des Bildes')), 30000)
      )
    ]);
    
    console.log(`Image loaded: ${img.naturalWidth}x${img.naturalHeight} pixels`);
    progress.incrementProgress(5, 'Bild geladen');
    
    // PDF-Dokument mit kompatiblen Optionen für Illustrator erstellen
    const pdfDoc = await PDFDocument.create({
      updateMetadata: false // Keine Standardmetadaten hinzufügen, die Probleme verursachen könnten
    });
    
    progress.setProgress('PROCESSING_IMAGE', 'Verarbeite Bild...');
    
    // Bilddaten abrufen - mit verbesserter Handhabung für große Daten-URLs
    const imageData = await fetchImageData(optimizedImageUrl, progress);
    
    if (!imageData) {
      throw new Error("Keine Bilddaten verfügbar");
    }
    
    progress.incrementProgress(10, 'PDF wird erstellt...');
    
    try {
      // Farbraum des Bildes erkennen
      console.log('Detecting image color space');
      const detectedColorSpace = await detectImageColorSpace(loadedImg);
      console.log(`Detected color space: ${detectedColorSpace}`);

      progress.incrementProgress(2, 'Farbraum erkannt');

      // Bild in PDF einbetten - unter Beibehaltung der Originaldimensionen
      console.log('Embedding image in PDF');
      const jpgImage = await pdfDoc.embedJpg(imageData);

      progress.incrementProgress(5, 'Bild in PDF eingebettet');
      
      // Pixelabmessungen des Bildes erhalten
      const pixelWidth = img.naturalWidth;
      const pixelHeight = img.naturalHeight;
      
      // DPI aus den Pixelabmessungen berechnen
      const imageDPI = detectImageDPI(img);
      
      console.log(`Image dimensions: ${pixelWidth}x${pixelHeight} pixels`);
      console.log(`Detected DPI: ${imageDPI}`);
      
      // Physikalische Abmessungen in Zoll basierend auf Pixelabmessungen und DPI berechnen
      const widthInInches = pixelWidth / imageDPI;
      const heightInInches = pixelHeight / imageDPI;
      
      // Physikalische Abmessungen in Punkte umrechnen (72 Punkte = 1 Zoll, was der PDF-Standard ist)
      const pdfPageWidth = widthInInches * 72;
      const pdfPageHeight = heightInInches * 72;
      
      // In cm umrechnen zur Anzeige
      const widthInCm = widthInInches * 2.54;
      const heightInCm = heightInInches * 2.54;
      
      console.log(`Physical dimensions: ${widthInCm.toFixed(2)}x${heightInCm.toFixed(2)} cm`);
      console.log(`PDF page size in points: ${pdfPageWidth.toFixed(2)}x${pdfPageHeight.toFixed(2)} pt`);
      
      // Seite mit Abmessungen erstellen, die der physikalischen Größe entsprechen
      console.log('Creating PDF page');
      const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);
      
      progress.setProgress('CREATING_PDF', 'Erstelle PDF mit CutContour...');
      
      // Bild in voller Seitengröße zeichnen
      console.log('Drawing image on page');
      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: pdfPageWidth,
        height: pdfPageHeight,
      });
      
      const pdfContext = pdfDoc.context;

      // Spot-Farbnamen aus den Settings verwenden
      const spotColorName = settings.spotColorName || "CutContour";

      // CutContour zum PDF hinzufügen
      await createCutContour({
        page,
        pdfContext,
        pdfPageWidth,
        pdfPageHeight,
        spotColorName,
        cutContourOffset: settings.cutContourOffset,
        progress
      });
      
      // Farbraum-Management und ICC-Profil-Einbettung
      let iccProfileEmbedded = false;
      let targetColorSpace = detectedColorSpace;

      if (settings.convertColorSpace && settings.targetColorSpace) {
        // Farbraum-Konvertierung ist aktiviert
        targetColorSpace = settings.targetColorSpace;
        console.log(`Color space conversion enabled: ${detectedColorSpace} → ${targetColorSpace}`);

        // ICC-Profil einbetten, falls vorhanden
        if (settings.iccProfileData) {
          console.log('Embedding ICC profile for color conversion');
          progress.incrementProgress(2, 'ICC-Profil wird eingebettet...');

          embedICCProfile(
            pdfDoc,
            pdfContext,
            settings.iccProfileData,
            targetColorSpace,
            settings.defaultICCProfile || 'Custom ICC Profile'
          );
          iccProfileEmbedded = true;

          progress.incrementProgress(3, 'ICC-Profil eingebettet');
        } else {
          console.warn('Color space conversion requested but no ICC profile provided');
        }
      } else {
        // Farbraum beibehalten
        console.log(`Preserving original color space: ${detectedColorSpace}`);
        targetColorSpace = detectedColorSpace;
      }

      // Dateinamen aus URL für Metadaten extrahieren
      const fileName = imageUrl.split('/').pop()?.split('.')[0] || 'Image';

      // Abmessungen zum Dateinamen für Klarheit hinzufügen
      const fileNameWithDimensions = `${fileName}_${widthInCm.toFixed(1)}x${heightInCm.toFixed(1)}cm`;

      console.log('Setting PDF metadata');
      // PDF-Metadaten mit Adobe Illustrator-Kompatibilität festlegen
      // Skip OutputIntents if we already embedded an ICC profile
      addPdfMetadata(pdfDoc, pdfContext, fileNameWithDimensions, iccProfileEmbedded);
      
      progress.incrementProgress(10, 'PDF wird finalisiert...');
      
      // PDF mit optimalen Einstellungen für Print-Workflows speichern
      console.log('Saving PDF document');
      
      // Verwenden Sie einen höheren Wert für objectsPerTick für große PDF-Dateien
      // Dies verhindert Timing-Out bei der Verarbeitung
      const pdfBytes = await pdfDoc.save({ 
        useObjectStreams: false,      // Bessere Kompatibilität mit RIP-Systemen
        addDefaultPage: false,        // Keine leeren Seiten
        objectsPerTick: 100,          // In kleineren Batches verarbeiten, aber mehr pro Tick für große Dateien
        updateFieldAppearances: false, // Keine Formularfelder
      });
      
      console.log(`PDF created successfully: ${pdfBytes.byteLength} bytes`);
      
      progress.setProgress('FINALIZING', 'PDF wird fertiggestellt...');
      
      // Bei großen PDFs direkt einen Blob-URL erstellen statt einer Daten-URL
      // Dies ist speichereffizienter für große Dateien
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      
      progress.complete('PDF fertiggestellt');
      
      return pdfUrl;
    } catch (error) {
      console.error('Fehler beim Erstellen des PDFs:', error);
      if (error instanceof Error && error.message.includes("allocation")) {
        throw new Error("Nicht genügend Speicher, um das Bild zu verarbeiten. Bitte verkleinern Sie das Bild.");
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating PDF with cut contour:', error);
    progress.complete('Fehler bei der PDF-Erstellung');
    throw new Error(`PDF-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};

// Function to detect DPI from image
const detectImageDPI = (img: HTMLImageElement): number => {
  // For now we're using a simple approach - read image size in pixels
  // and estimate DPI based on reasonable physical size
  
  // The actual detection happens client-side - for now we'll log what we're using
  const inferredDPI = 72; // Default DPI for PDFs and web display
  console.log(`Using DPI: ${inferredDPI}`);
  return inferredDPI;
};

// Function to fetch image data with progress tracking
const fetchImageData = async (imageUrl: string, progress: any): Promise<ArrayBuffer> => {
  try {
    console.log('Processing image data');
    
    // Whether we're dealing with a blob or data URL, handle appropriately
    if (imageUrl.startsWith('blob:')) {
      // For blob URLs, fetch the blob and convert to array buffer
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`);
      return await response.arrayBuffer();
    }
    // For data URLs, process differently based on size
    else if (imageUrl.startsWith('data:')) {
      // Extract base64 content from data URL
      const base64Content = imageUrl.split(',')[1];
      
      // Estimate size (base64 is ~4/3 the size of binary)
      const estimatedSize = (base64Content.length * 3) / 4;
      
      if (estimatedSize > FILE_STORAGE_LIMITS.MAX_FETCH_SIZE) {
        console.log('Large data URL detected, using direct conversion');
        // For very large data URLs, convert directly to binary without using fetch
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        
        // Process in chunks to avoid call stack errors with very large strings
        const chunkSize = 1024 * 1024; // 1MB chunks
        for (let i = 0; i < binaryString.length; i += chunkSize) {
          const chunk = Math.min(chunkSize, binaryString.length - i);
          for (let j = 0; j < chunk; j++) {
            bytes[i + j] = binaryString.charCodeAt(i + j);
          }
          // Allow UI thread to breathe between chunks
          if (i + chunk < binaryString.length && (i % (chunkSize * 5) === 0)) {
            await new Promise(resolve => setTimeout(resolve, 0));
            progress.incrementProgress(1, 'Verarbeite Bilddaten...');
          }
        }
        
        return bytes.buffer;
      } else {
        console.log('Using fetch for data URL');
        // For smaller data URLs, we can use fetch which is more efficient
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        return await response.arrayBuffer();
      }
    } else {
      // For regular URLs, fetch the data
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error(`Fehler beim Laden des Bildes: ${error.message}`);
  }
};
