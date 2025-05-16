
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
  const { convertToPdf, isConverting, conversionProgress } = usePDFConverter();

  const handleConvertToPdf = async (fileId: string) => {
    setIsLoading(true);
    try {
      // Find the file to convert
      const file = files.find(f => f.id === fileId);
      if (!file) {
        return;
      }
      
      // Convert to PDF
      const pdfUrl = await convertToPdf(file);
      
      if (!pdfUrl) {
        return;
      }
      
      // Determine if the original file was an image or PDF
      const isImage = file.type.startsWith('image/');
      
      // Update file with converted PDF URL
      const updatedFiles = files.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              convertedPdfUrl: pdfUrl, 
              originalFormat: isImage ? "image" : "pdf" 
            }
          : f
      );
      
      setFiles(updatedFiles);
      
      // Update selected file if it's the one we just converted
      if (selectedFile?.id === fileId) {
        setSelectedFile({ 
          ...selectedFile, 
          convertedPdfUrl: pdfUrl, 
          originalFormat: isImage ? "image" : "pdf"
        });
      }
      
      return pdfUrl;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    convertToPdf: handleConvertToPdf,
    isConverting,
    conversionProgress
  };
};
