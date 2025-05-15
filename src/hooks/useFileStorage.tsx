
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';
import { saveFilesToDB, loadFilesFromDB } from '../utils/indexedDBUtils';
import { useFileProcessor } from './useFileProcessor';
import { usePDFConverter } from './usePDFConverter';

export const useFileStorage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { processFiles, isProcessing } = useFileProcessor();
  const { convertToPdf, isConverting } = usePDFConverter();

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
      const processedFiles = await processFiles(newFiles, files);
      
      if (processedFiles.length > 0) {
        setFiles(prev => [...prev, ...processedFiles]);
        
        if (!selectedFile) {
          setSelectedFile(processedFiles[0]);
        }
      }
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

  const handleConvertToPdf = async (fileId: string) => {
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
      
      // Convert to PDF
      const pdfUrl = await convertToPdf(file);
      
      if (!pdfUrl) {
        return;
      }
      
      // Update file with converted PDF URL
      const updatedFiles = files.map(f => 
        f.id === fileId 
          ? { ...f, convertedPdfUrl: pdfUrl }
          : f
      );
      
      setFiles(updatedFiles);
      
      // Update selected file if it's the one we just converted
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, convertedPdfUrl: pdfUrl });
      }
      
      return pdfUrl;
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
    isLoading: isLoading || isProcessing || isConverting,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf: handleConvertToPdf,
    clearAllFiles,
    MAX_FILE_SIZE_MB: FILE_STORAGE_LIMITS.MAX_FILE_SIZE_MB,
    MAX_FILES: FILE_STORAGE_LIMITS.MAX_FILES
  };
};
