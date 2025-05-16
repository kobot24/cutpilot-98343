
import { useState } from 'react';
import { UploadedFile } from '../types/fileTypes';
import { usePDFConverter } from './usePDFConverter';

export const usePDFOperations = (
  files: UploadedFile[],
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  selectedFile: UploadedFile | null,
  setSelectedFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { 
    convertToPdf: pdfConverterFn, 
    isConverting, 
    conversionProgress,
    batchProgress,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion
  } = usePDFConverter();

  const handleConvertToPdf = async (fileId: string) => {
    console.log(`PDF Operations: Converting file ${fileId} to PDF`);
    setIsLoading(true);
    try {
      // Find the file to convert
      const file = files.find(f => f.id === fileId);
      if (!file) {
        console.log(`PDF Operations: File ${fileId} not found`);
        return null;
      }
      
      // Convert to PDF
      const pdfUrl = await pdfConverterFn(file);
      
      if (!pdfUrl) {
        console.log(`PDF Operations: No PDF URL returned for file ${fileId}`);
        return null;
      }
      
      console.log(`PDF Operations: Successfully converted file ${fileId} to PDF`);
      
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
    } catch (error) {
      console.error(`PDF Operations: Error converting file ${fileId} to PDF:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle batch conversion properly
  const handleBatchConvertToPdf = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    console.log(`PDF Operations: Starting batch conversion of ${fileIds.length} files`);
    
    // Initialize batch conversion progress
    if (startBatchConversion && fileIds.length > 0) {
      const firstFile = files.find(f => f.id === fileIds[0]);
      startBatchConversion(fileIds.length, firstFile?.name || 'Unknown File');
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // IMPORTANT: Process files sequentially to avoid memory issues and track progress properly
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        console.log(`PDF Operations: File with ID ${fileId} not found for batch conversion`);
        failCount++;
        continue;
      }
      
      console.log(`PDF Operations: Converting file ${i + 1}/${fileIds.length}: ${file.name}`);
      
      // Update batch progress before conversion
      if (updateBatchProgress) {
        updateBatchProgress(i + 1, file.name, false);
      }
      
      try {
        // Wait for each conversion to complete before moving to the next
        const result = await handleConvertToPdf(fileId);
        if (result) {
          successCount++;
          console.log(`PDF Operations: Successfully converted ${file.name} to PDF in batch process`);
          if (updateBatchProgress) {
            updateBatchProgress(i + 1, file.name, true);
          }
        } else {
          failCount++;
          console.log(`PDF Operations: Failed to convert ${file.name} to PDF in batch process`);
        }
      } catch (error) {
        console.error(`PDF Operations: Error in batch converting file ${fileId}:`, error);
        failCount++;
      }
    }
    
    console.log(`PDF Operations: Batch conversion completed: ${successCount} successful, ${failCount} failed`);
    
    // End batch conversion
    if (endBatchConversion) {
      endBatchConversion();
    }
    
    return { successCount, failCount };
  };

  return {
    convertToPdf: handleConvertToPdf,
    batchConvertToPdf: handleBatchConvertToPdf, // Adding the new batch function
    isConverting,
    conversionProgress,
    batchProgress,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion
  };
};
