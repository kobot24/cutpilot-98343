
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
    batchConvertToPdf,
    isConverting,
    conversionProgress,
    batchProgress,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion
  } = usePDFOperations(files, setFiles, selectedFile, setSelectedFile, setIsLoading);
  
  // Use the storage sync hook with the new functions
  const { setBatchMode, updateSingleFile } = useFileStorageSync(
    files,
    setFiles,
    setSelectedFile,
    setIsLoading,
    setIsInitialized,
    isInitialized
  );
  
  // Enhanced batch convert that coordinates with file storage sync
  const handleBatchConvertToPdf = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    console.log(`FileStorage: Starting enhanced batch conversion of ${fileIds.length} files`);
    
    // Tell the storage sync we're starting batch mode
    setBatchMode(true);
    
    // Run the batch conversion
    const result = await batchConvertToPdf(fileIds);
    
    // Tell the storage sync we're done with batch mode
    setBatchMode(false);
    
    return result;
  };

  return {
    files,
    selectedFile,
    isLoading: isLoading || isProcessing || isConverting,
    conversionProgress,
    batchProgress,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf,
    batchConvertToPdf: handleBatchConvertToPdf, // Use our enhanced version
    clearAllFiles,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion,
    updateSingleFile, // Expose the new function
    MAX_FILE_SIZE_MB: FILE_STORAGE_LIMITS.MAX_FILE_SIZE_MB,
    MAX_FILES: FILE_STORAGE_LIMITS.MAX_FILES
  };
};
