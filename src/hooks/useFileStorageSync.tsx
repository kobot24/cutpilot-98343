
import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { saveFilesToDB, loadFilesFromDB, updateFileInDB } from '../utils/indexedDBUtils';

export const useFileStorageSync = (
  files: UploadedFile[],
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>,
  isInitialized: boolean
) => {
  // Ref to track if we're in batch mode
  const pendingFileUpdates = useRef<{[id: string]: UploadedFile}>({});
  const batchModeRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Load files from IndexedDB on component mount
  useEffect(() => {
    const initializeFiles = async () => {
      setIsLoading(true);
      try {
        const loadedFiles = await loadFilesFromDB();
        // Clean up any orphaned blob URLs
        loadedFiles.forEach(file => {
          if (file.convertedPdfUrl && !file.convertedPdfUrl.startsWith('blob:')) {
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
    // Clear any existing timeout to prevent race conditions
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    const saveFiles = async () => {
      if (isInitialized && files.length > 0) {
        try {
          // In batch mode, we've already saved individual files
          if (!batchModeRef.current) {
            console.log('FileStorageSync: Saving all files to IndexedDB');
            await saveFilesToDB(files);
          } else {
            console.log('FileStorageSync: Skip full save during batch mode, individual files already saved');
            // Reset batch mode after saving is complete
            batchModeRef.current = false;
          }
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
    saveTimeoutRef.current = window.setTimeout(saveFiles, 500);
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [files, isInitialized]);

  // Initialize selected file when files change
  useEffect(() => {
    if (files.length > 0 && !files.some(file => file.id === null)) {
      setSelectedFile(files[0]);
    } else if (files.length === 0) {
      setSelectedFile(null);
    }
  }, [files, setSelectedFile]);
  
  // New function to mark that we're in batch mode
  const setBatchMode = (active: boolean) => {
    console.log(`FileStorageSync: Setting batch mode to ${active}`);
    batchModeRef.current = active;
  };
  
  // New function to update a single file during batch processing
  const updateSingleFile = async (updatedFile: UploadedFile): Promise<void> => {
    if (!isInitialized) return;
    
    console.log(`FileStorageSync: Updating single file ${updatedFile.id} - ${updatedFile.name}`);
    try {
      // Update the file in IndexedDB directly
      await updateFileInDB(updatedFile);
    } catch (error) {
      console.error(`Error updating single file ${updatedFile.id} in IndexedDB:`, error);
      // Don't show toast here as it could flood the UI during batch operations
    }
  };

  return {
    setBatchMode,
    updateSingleFile
  };
};
