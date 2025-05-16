
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { readFileAsDataURL, generateId } from '../utils/fileUtils';
import { UploadedFile } from '../types/fileTypes';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';
import { validateFiles, isLargeFile } from '../utils/fileValidationUtils';

export const useFileProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (newFiles: FileList, currentFiles: UploadedFile[]): Promise<UploadedFile[]> => {
    setIsProcessing(true);
    
    try {
      // Filter by file type and size
      const filesArray = validateFiles(Array.from(newFiles));
      
      if (filesArray.length === 0) {
        return [];
      }

      // Process the files - with special handling for large files
      const processedFiles = [];
      
      // Find large files that need special handling
      const largeFiles = filesArray.filter(file => isLargeFile(file));
      const standardFiles = filesArray.filter(file => !isLargeFile(file));
      
      if (largeFiles.length > 0) {
        toast({
          title: "Große Dateien erkannt",
          description: `${largeFiles.length} große ${largeFiles.length === 1 ? 'Datei wird' : 'Dateien werden'} verarbeitet. Dies kann einen Moment dauern.`,
        });
      }
      
      // Process standard files first - these can be loaded in parallel in batches
      for (let i = 0; i < standardFiles.length; i += 3) {
        const batch = standardFiles.slice(i, i + 3);
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
              convertedPdfData: undefined,
              convertedPdfUrl: undefined
            };
          })
        );
        processedFiles.push(...batchResults);
      }
      
      // Process large files one by one to avoid memory issues
      for (const file of largeFiles) {
        // For large files, we'll use blob URLs instead of data URLs
        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);
        
        processedFiles.push({
          id: generateId(),
          name: file.name,
          url,
          type: file.type,
          size: file.size,
          createdAt: new Date(),
          convertedPdfData: undefined,
          convertedPdfUrl: undefined
        });
        
        // Allow UI thread to breathe between large files
        if (largeFiles.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Show success toast
      if (processedFiles.length > 0) {
        toast({
          title: "Dateien hinzugefügt",
          description: `${processedFiles.length} ${processedFiles.length === 1 ? 'Datei' : 'Dateien'} erfolgreich hinzugefügt`
        });
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
