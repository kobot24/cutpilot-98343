import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UploadedFile } from '../types/fileTypes';
import { readFileAsDataURL, generateId } from '../utils/fileUtils';
import { createPdfWithCutContour } from '../utils/pdfUtils';
import { useLocalStorage } from './useLocalStorage';

// Constants for storage management
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 50; // Increased from 10MB to 50MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useFileStorage = () => {
  const [files, setFiles] = useLocalStorage<UploadedFile[]>('uploadedFiles', [], handleStorageQuotaExceeded);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle local storage quota exceeded
  function handleStorageQuotaExceeded() {
    toast.error(`Speicherlimit erreicht. Bitte löschen Sie einige Dateien.`);
    
    // If we have files in state already, keep only the most recent ones
    if (files.length > 1) {
      // Keep only the most recent files to recover from this state
      const sortedFiles = [...files].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const reducedFiles = sortedFiles.slice(0, Math.max(1, Math.floor(files.length / 2)));
      setFiles(reducedFiles);
    }
  }

  // Initialize selected file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    } else if (files.length === 0) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  const addFiles = async (newFiles: FileList) => {
    setIsLoading(true);
    
    try {
      // Process the files - limit to 3 at a time to avoid memory issues
      const processedFiles = [];
      for (let i = 0; i < newFiles.length; i += 2) {
        const batch = Array.from(newFiles).slice(i, i + 2);
        
        // Create a timeout to give UI a chance to breathe between batches
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            try {
              console.log(`Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
              const url = await readFileAsDataURL(file);
              return {
                id: generateId(),
                name: file.name,
                url,
                type: file.type,
                size: file.size,
                createdAt: new Date(),
              };
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
              toast.error(`Fehler beim Verarbeiten von ${file.name}`);
              return null;
            }
          })
        );
        
        // Filter out null results from errors
        processedFiles.push(...batchResults.filter(Boolean));
      }

      if (processedFiles.length === 0) {
        toast.error('Keine Dateien konnten verarbeitet werden');
        setIsLoading(false);
        return;
      }

      // Update files state
      setFiles(prev => {
        // If we're approaching the max files limit, show a warning
        if (prev.length + processedFiles.length >= MAX_FILES) {
          toast.warning(`Sie nähern sich dem Limit von ${MAX_FILES} Dateien.`);
        }
        return [...prev, ...processedFiles];
      });
      
      if (processedFiles.length > 0 && !selectedFile) {
        setSelectedFile(processedFiles[0]);
      }
      
      toast.success(`${processedFiles.length} ${processedFiles.length === 1 ? 'Datei' : 'Dateien'} erfolgreich hochgeladen`);
    } catch (error) {
      console.error('Error adding files:', error);
      toast.error('Fehler beim Hinzufügen der Dateien');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    if (selectedFile?.id === id) {
      const remainingFiles = files.filter(file => file.id !== id);
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const selectFile = (id: string) => {
    const file = files.find(file => file.id === id);
    if (file) {
      setSelectedFile(file);
    }
  };

  const convertToPdf = async (fileId: string) => {
    setIsLoading(true);
    try {
      // Find the file to convert
      const file = files.find(f => f.id === fileId);
      if (!file) {
        toast.error('Datei nicht gefunden');
        return;
      }
      
      // Get settings from localStorage
      const storedSettings = localStorage.getItem('userSettings');
      const settings = storedSettings 
        ? JSON.parse(storedSettings)
        : { cutContourOffset: 3, spotColorName: 'CutContour' };
      
      // Create PDF with cut contour
      const pdfUrl = await createPdfWithCutContour(file.url, settings);
      
      // Instead of storing the entire PDF in localStorage (which can cause quota issues),
      // create a blob URL that can be used temporarily
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Update file with converted PDF URL (using blob URL)
      const updatedFiles = files.map(f => 
        f.id === fileId 
          ? { ...f, convertedPdfUrl: blobUrl }
          : f
      );
      
      setFiles(updatedFiles);
      
      // Update selected file if it's the one we just converted
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, convertedPdfUrl: blobUrl });
      }

      return blobUrl;
    } catch (error) {
      console.error('Error converting file to PDF:', error);
      toast.error(`PDF-Konvertierung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllFiles = () => {
    // Release any blob URLs to avoid memory leaks
    files.forEach(file => {
      if (file.convertedPdfUrl && file.convertedPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(file.convertedPdfUrl);
      }
    });
    
    setFiles([]);
    setSelectedFile(null);
    toast.success('Alle Dateien wurden gelöscht');
  };

  return {
    files,
    selectedFile,
    isLoading,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf,
    clearAllFiles,
    MAX_FILE_SIZE_MB,
    MAX_FILES
  };
};
