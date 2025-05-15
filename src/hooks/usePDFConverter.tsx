
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { createPdfWithCutContour } from '../utils/pdfUtils';
import { isImageTooLarge } from '../utils/fileValidationUtils';

export const usePDFConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertToPdf = async (file: UploadedFile): Promise<string | undefined> => {
    if (!file) return undefined;
    
    setIsConverting(true);
    try {
      // Check if the image is too large for PDF conversion
      const tooLarge = await isImageTooLarge(file.url);
      if (tooLarge) {
        toast({
          title: "Bild zu groß",
          description: "Das Bild ist zu groß für die PDF-Konvertierung. Versuchen Sie, das Bild zu verkleinern.",
          variant: "destructive"
        });
        return undefined;
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
      
      // Create PDF with cut contour
      const pdfUrl = await createPdfWithCutContour(file.url, settings);
      
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
      toast({
        title: "Konvertierungsfehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler bei der PDF-Konvertierung",
        variant: "destructive"
      });
      return undefined;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    convertToPdf,
    isConverting
  };
};
