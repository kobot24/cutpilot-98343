
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { readFileAsDataURL, generateId } from '../utils/fileUtils';
import { createPdfWithCutContour } from '../utils/pdfUtils';
import { saveFilesToDB, loadFilesFromDB } from '../utils/indexedDBUtils';

// Constants for storage management
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 50; // Increased from 10MB to 50MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useFileStorage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load files from IndexedDB on component mount
  useEffect(() => {
    const initializeFiles = async () => {
      setIsLoading(true);
      try {
        const loadedFiles = await loadFilesFromDB();
        // Clean up any orphaned blob URLs
        loadedFiles.forEach(file => {
          if (file.convertedPdfUrl && !file.convertedPdfData && file.convertedPdfUrl.startsWith('blob:')) {
            // This is a blob URL from a previous session, it's no longer valid
            // We'll mark it as undefined so the UI knows it needs to be regenerated
            file.convertedPdfUrl = undefined;
          }
        });
        
        setFiles(loadedFiles);
        if (loadedFiles.length > 0) {
          setSelectedFile(loadedFiles[0]);
        }
      } catch (error) {
        console.error('Error loading files from IndexedDB:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Fehler beim Laden der Dateien",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeFiles();
  }, []);

  // Save files to IndexedDB whenever they change
  useEffect(() => {
    const saveFiles = async () => {
      if (isInitialized && files.length > 0) {
        try {
          await saveFilesToDB(files);
        } catch (error) {
          console.error('Error saving files to IndexedDB:', error);
          toast({
            title: "Speicherfehler",
            description: "Fehler beim Speichern der Dateien. Möglicherweise ist der Speicherplatz voll.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Use a small delay to batch multiple rapid changes
    const timeoutId = setTimeout(saveFiles, 300);
    return () => clearTimeout(timeoutId);
  }, [files, isInitialized]);

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
      // Filter by file type and size
      const filesArray = Array.from(newFiles).filter(file => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Nicht unterstützt",
            description: `Datei "${file.name}" ist kein unterstütztes Bildformat`,
            variant: "destructive"
          });
          return false;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
            title: "Datei zu groß",
            description: `Datei "${file.name}" überschreitet ${MAX_FILE_SIZE_MB}MB Limit`,
            variant: "destructive"
          });
          return false;
        }
        return true;
      });

      // Check if we're going to exceed the max file count
      if (files.length + filesArray.length > MAX_FILES) {
        toast({
          title: "Dateien-Limit erreicht",
          description: `Maximum von ${MAX_FILES} Dateien erreicht. Löschen Sie einige Dateien, um neue hinzuzufügen.`,
          variant: "warning"
        });
        filesArray.splice(MAX_FILES - files.length); // Keep only what we can add
      }
      
      if (filesArray.length === 0) {
        setIsLoading(false);
        return;
      }

      // Process the files - limit to 3 at a time to avoid memory issues
      const processedFiles = [];
      for (let i = 0; i < filesArray.length; i += 3) {
        const batch = filesArray.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            const url = await readFileAsDataURL(file);
            return {
              id: generateId(),
              name: file.name,
              url,
              type: file.type,
              size: file.size,
              createdAt: new Date(),
            };
          })
        );
        processedFiles.push(...batchResults);
      }

      // Update files state in batches to avoid memory issues
      setFiles(prev => {
        // If we're approaching the max files limit, show a warning
        if (prev.length + processedFiles.length >= MAX_FILES) {
          toast({
            title: "Fast am Limit",
            description: `Sie nähern sich dem Limit von ${MAX_FILES} Dateien.`,
            variant: "warning"
          });
        }
        return [...prev, ...processedFiles];
      });
      
      if (processedFiles.length > 0 && !selectedFile) {
        setSelectedFile(processedFiles[0]);
      }
      
      toast({
        title: "Dateien hinzugefügt",
        description: `${processedFiles.length} Dateien erfolgreich hinzugefügt`
      });
    } catch (error) {
      console.error('Error adding files:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hinzufügen der Dateien",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    // First get the file to check if it has a blob URL
    const fileToRemove = files.find(file => file.id === id);
    
    // Revoke any blob URL to prevent memory leaks
    if (fileToRemove?.convertedPdfUrl && fileToRemove.convertedPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.convertedPdfUrl);
    }
    
    // Remove file from state
    setFiles(files.filter(file => file.id !== id));
    
    // Update selected file if needed
    if (selectedFile?.id === id) {
      const remainingFiles = files.filter(file => file.id !== id);
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
    
    toast({
      title: "Datei gelöscht",
      description: fileToRemove?.name || "Datei wurde erfolgreich gelöscht"
    });
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
        toast({
          title: "Fehler",
          description: "Datei nicht gefunden",
          variant: "destructive"
        });
        return;
      }
      
      // Get settings from localStorage
      const storedSettings = localStorage.getItem('userSettings');
      const settings = storedSettings 
        ? JSON.parse(storedSettings)
        : { cutContourOffset: 3, spotColorName: 'CutContour' };
      
      // Create PDF with cut contour
      const pdfDataUrl = await createPdfWithCutContour(file.url, settings);
      
      // Convert the data URL to a blob for better memory management
      const response = await fetch(pdfDataUrl);
      const pdfBlob = await response.blob();
      
      // Create a blob URL for the PDF
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Update file with converted PDF URL and data
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
      toast({
        title: "Konvertierungsfehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler bei der PDF-Konvertierung",
        variant: "destructive"
      });
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
    
    toast({
      title: "Alle Dateien gelöscht",
      description: "Alle Dateien wurden erfolgreich gelöscht"
    });
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
