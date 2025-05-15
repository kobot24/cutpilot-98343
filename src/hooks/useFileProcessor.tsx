
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { readFileAsDataURL, generateId } from '../utils/fileUtils';
import { UploadedFile } from '../types/fileTypes';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';
import { validateFiles } from '../utils/fileValidationUtils';

export const useFileProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (newFiles: FileList, currentFiles: UploadedFile[]): Promise<UploadedFile[]> => {
    setIsProcessing(true);
    
    try {
      // Filter by file type and size
      const filesArray = validateFiles(Array.from(newFiles));

      // Check if we're going to exceed the max file count
      if (currentFiles.length + filesArray.length > FILE_STORAGE_LIMITS.MAX_FILES) {
        toast({
          title: "Dateien-Limit erreicht",
          description: `Maximum von ${FILE_STORAGE_LIMITS.MAX_FILES} Dateien erreicht. Löschen Sie einige Dateien, um neue hinzuzufügen.`,
          variant: "default"
        });
        filesArray.splice(FILE_STORAGE_LIMITS.MAX_FILES - currentFiles.length); // Keep only what we can add
      }
      
      if (filesArray.length === 0) {
        return [];
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
              convertedPdfData: undefined
            };
          })
        );
        processedFiles.push(...batchResults);
      }

      // Show success toast
      if (processedFiles.length > 0) {
        toast({
          title: "Dateien hinzugefügt",
          description: `${processedFiles.length} Dateien erfolgreich hinzugefügt`
        });

        // Show warning if approaching limit
        if (currentFiles.length + processedFiles.length >= FILE_STORAGE_LIMITS.MAX_FILES) {
          toast({
            title: "Fast am Limit",
            description: `Sie nähern sich dem Limit von ${FILE_STORAGE_LIMITS.MAX_FILES} Dateien.`,
            variant: "default"
          });
        }
      }
      
      return processedFiles;
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Verarbeiten der Dateien",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processFiles,
    isProcessing
  };
};
