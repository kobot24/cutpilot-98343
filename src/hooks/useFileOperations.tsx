
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '../types/fileTypes';
import { useFileProcessor } from './useFileProcessor';

export const useFileOperations = (
  initialFiles: UploadedFile[] = []
) => {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { processFiles, isProcessing } = useFileProcessor();

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
    setFiles,
    selectedFile,
    setSelectedFile,
    isLoading,
    setIsLoading,
    isProcessing,
    addFiles,
    removeFile,
    selectFile,
    clearAllFiles
  };
};
