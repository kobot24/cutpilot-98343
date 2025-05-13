
import { useState, useEffect } from 'react';

export type UploadedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  convertedPdfUrl?: string;
};

export const useFileStorage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load files from localStorage on initial render
  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles');
    if (storedFiles) {
      try {
        const parsedFiles = JSON.parse(storedFiles).map((file: any) => ({
          ...file,
          createdAt: new Date(file.createdAt),
        }));
        setFiles(parsedFiles);
      } catch (error) {
        console.error('Error parsing stored files:', error);
      }
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(files));
  }, [files]);

  const addFiles = async (newFiles: FileList) => {
    setIsLoading(true);
    
    try {
      const filesArray = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
      const newUploadedFiles: UploadedFile[] = await Promise.all(
        filesArray.map(async (file) => {
          const url = await readFileAsDataURL(file);
          return {
            id: generateId(),
            name: file.name,
            url,
            type: file.type,
            size: file.size,
            createdAt: new Date(),
          };
        })
      );

      setFiles(prev => [...prev, ...newUploadedFiles]);
      if (newUploadedFiles.length > 0 && !selectedFile) {
        setSelectedFile(newUploadedFiles[0]);
      }
    } catch (error) {
      console.error('Error adding files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const selectFile = (id: string) => {
    const file = files.find(file => file.id === id);
    if (file) {
      setSelectedFile(file);
    }
  };

  const convertToPdf = async (fileId: string) => {
    setIsLoading(true);
    try {
      // Here we just create a mock PDF conversion
      // In a real app, this would call an API or use a PDF generation library
      const file = files.find(f => f.id === fileId);
      if (!file) return;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock PDF URL (just using the image URL for now)
      const pdfUrl = file.url;
      
      // Update file with converted PDF URL
      setFiles(files.map(f => 
        f.id === fileId 
          ? { ...f, convertedPdfUrl: pdfUrl }
          : f
      ));
      
      // Update selected file if it's the one we just converted
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, convertedPdfUrl: pdfUrl });
      }

      return pdfUrl;
    } catch (error) {
      console.error('Error converting file to PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    files,
    selectedFile,
    isLoading,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf
  };
};

// Helper functions
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
