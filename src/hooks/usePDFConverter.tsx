
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { createPdfWithCutContour } from '../utils/pdf/pdfCreator';
import { isImageTooLarge } from '../utils/fileValidationUtils';

export type ConversionProgress = {
  progress: number;
  status: string;
};

export const usePDFConverter = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress>({ 
    progress: 0, 
    status: '' 
  });

  const convertToPdf = async (file: UploadedFile): Promise<string | undefined> => {
    if (!file) return undefined;
    
    setIsConverting(true);
    setConversionProgress({ progress: 0, status: 'Starte Konvertierung...' });
    
    try {
      // Check if the image is too large for PDF conversion
      const tooLarge = await isImageTooLarge(file.url);
      if (tooLarge) {
        toast({
          title: "Bild zu groß",
          description: "Das Bild ist zu groß für die PDF-Konvertierung. Das Bild wird optimiert.",
          variant: "default"
        });
        // Wir versuchen es trotzdem, da wir nun eine bessere Optimierung haben
      }
      
      // Get settings from localStorage
      const storedSettings = localStorage.getItem('userSettings');
      const settings = storedSettings 
        ? JSON.parse(storedSettings)
        : { cutContourOffset: 3, spotColorName: 'CutContour' };
      
      // Show processing toast
      toast({
        title: "PDF wird erstellt",
        description: "Bitte warten Sie, während die PDF erstellt wird..."
      });
      
      // Track progress during PDF creation
      const handleProgress = (progress: number, status: string) => {
        console.log(`PDF Fortschritt: ${progress}%, Status: ${status}`);
        setConversionProgress({ progress, status });
      };
      
      // Create PDF with cut contour
      const pdfUrl = await createPdfWithCutContour(file.url, settings, handleProgress);
      
      if (!pdfUrl) {
        throw new Error("Keine PDF-URL zurückgegeben");
      }
      
      toast({
        title: "PDF erstellt",
        description: "PDF mit CutContour wurde erfolgreich erstellt"
      });
      
      return pdfUrl;
    } catch (error) {
      console.error('Error converting file to PDF:', error);
      
      // Detailliertere Fehlermeldungen
      let errorMessage = "Unbekannter Fehler bei der PDF-Konvertierung";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Spezifische Fehlermeldungen für häufige Fehler
        if (error.message.includes("memory") || error.message.includes("speicher")) {
          errorMessage = "Nicht genügend Speicher. Das Bild ist zu groß.";
        } else if (error.message.includes("CORS") || error.message.includes("origin")) {
          errorMessage = "CORS-Fehler beim Zugriff auf das Bild. Versuchen Sie, das Bild erneut hochzuladen.";
        } else if (error.message.includes("timeout") || error.message.includes("zeit")) {
          errorMessage = "Zeitüberschreitung bei der Verarbeitung. Das Bild ist möglicherweise zu groß.";
        }
      }
      
      toast({
        title: "Konvertierungsfehler",
        description: errorMessage,
        variant: "destructive"
      });
      return undefined;
    } finally {
      setIsConverting(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => {
        setConversionProgress({ progress: 0, status: '' });
      }, 1000);
    }
  };

  return {
    convertToPdf,
    isConverting,
    conversionProgress
  };
};
