
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
        return;
      }
      
      // Convert to PDF
      const pdfUrl = await pdfConverterFn(file);
      
      if (!pdfUrl) {
        console.log(`PDF Operations: No PDF URL returned for file ${fileId}`);
        return;
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    convertToPdf: handleConvertToPdf,
    isConverting,
    conversionProgress,
    batchProgress,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion
  };
};
