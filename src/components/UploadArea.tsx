import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadedFile } from '@/types/fileTypes';
import { isTauri } from '@/utils/tauri';
import { openFileDialog, readBinaryFile, convertFilePath } from '@/utils/tauriFileDialog';

type UploadAreaProps = {
  onFilesAdded: (files: FileList) => void;
  isLoading: boolean;
  files: UploadedFile[];
  maxFiles?: number;
  maxFileSizeMB?: number;
  onClearAllFiles: () => void;
};

export const UploadArea = ({ 
  onFilesAdded, 
  isLoading, 
  files,
  maxFiles = 10,
  maxFileSizeMB = 2,
  onClearAllFiles
}: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/jpeg') ||
                file.type.startsWith('image/jpg') ||
                file.type === 'application/pdf'
      );

      if (validFiles.length === 0) {
        toast.error('Nur JPG- und PDF-Dateien werden unterstützt');
        return;
      }

      onFilesAdded(e.dataTransfer.files);
    }
  }, [onFilesAdded]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  }, [onFilesAdded]);

  // Tauri native file dialog handler
  const handleTauriFileSelect = useCallback(async () => {
    try {
      const selected = await openFileDialog({
        multiple: true,
        filters: [
          {
            name: 'Bilder und PDFs',
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'pdf']
          }
        ]
      });

      if (!selected) return;

      const filePaths = Array.isArray(selected) ? selected : [selected];

      // Convert file paths to File objects
      const filePromises = filePaths.map(async (filePath) => {
        const contents = await readBinaryFile(filePath);
        if (!contents) return null;

        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'file';
        const extension = fileName.split('.').pop()?.toLowerCase();

        let mimeType = 'image/jpeg';
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'bmp') mimeType = 'image/bmp';
        else if (extension === 'pdf') mimeType = 'application/pdf';

        const blob = new Blob([contents], { type: mimeType });
        return new File([blob], fileName, { type: mimeType });
      });

      const files = await Promise.all(filePromises);
      const validFiles = files.filter((f): f is File => f !== null);

      if (validFiles.length > 0) {
        // Create a FileList-like object
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        onFilesAdded(dataTransfer.files);
      }
    } catch (error) {
      console.error('Error selecting files with Tauri:', error);
      toast.error('Fehler beim Öffnen der Dateiauswahl');
    }
  }, [onFilesAdded]);

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed p-6 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 rounded-full bg-blue-100 p-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <p className="mb-4 text-sm text-gray-500">
            JPG- oder PDF-Dateien hier ablegen oder klicken Sie zum Auswählen
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (isTauri()) {
                  handleTauriFileSelect();
                } else {
                  document.getElementById('fileInput')?.click();
                }
              }}
              disabled={isLoading}
            >
              Dateien auswählen
            </Button>
          </div>

          <input
            id="fileInput"
            type="file"
            accept=".jpg,.jpeg,.pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="mt-4 space-y-1 text-xs text-gray-400">
            <p>Unterstützte Formate: JPG, JPEG, PDF</p>
            <p>Maximale Dateigröße: {maxFileSizeMB}MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
