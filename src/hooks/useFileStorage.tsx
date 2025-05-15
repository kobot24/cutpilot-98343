
import { useState } from 'react';
import { UploadedFile } from '../types/fileTypes';
import { FILE_STORAGE_LIMITS } from '../constants/fileStorage';
import { useFileOperations } from './useFileOperations';
import { usePDFOperations } from './usePDFOperations';
import { useFileStorageSync } from './useFileStorageSync';

export const useFileStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use the file operations hook
  const {
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
  } = useFileOperations([]);
  
  // Use the PDF operations hook
  const {
    convertToPdf,
    isConverting,
    conversionProgress
  } = usePDFOperations(files, setFiles, selectedFile, setSelectedFile, setIsLoading);
  
  // Use the storage sync hook
  useFileStorageSync(
    files,
    setFiles,
    setSelectedFile,
    setIsLoading,
    setIsInitialized,
    isInitialized
  );

  return {
    files,
    selectedFile,
    isLoading: isLoading || isProcessing || isConverting,
    conversionProgress,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf,
    clearAllFiles,
    MAX_FILE_SIZE_MB: FILE_STORAGE_LIMITS.MAX_FILE_SIZE_MB,
    MAX_FILES: FILE_STORAGE_LIMITS.MAX_FILES
  };
};
