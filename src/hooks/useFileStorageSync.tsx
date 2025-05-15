
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { saveFilesToDB, loadFilesFromDB } from '../utils/indexedDBUtils';

export const useFileStorageSync = (
  files: UploadedFile[],
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>,
  isInitialized: boolean
) => {
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
  }, [setFiles, setIsLoading, setIsInitialized, setSelectedFile]);

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
    if (files.length > 0 && !files.find(f => f.id === setSelectedFile)) {
      setSelectedFile(files[0]);
    } else if (files.length === 0) {
      setSelectedFile(null);
    }
  }, [files, setSelectedFile]);
};
