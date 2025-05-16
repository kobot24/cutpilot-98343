
import React from 'react';
import { Button } from '@/components/ui/button';
import { UploadArea } from '@/components/UploadArea';
import { FilesList } from '@/components/FilesList';
import { UploadedFile } from '@/types/fileTypes';

type UploadSectionProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  onFilesAdded: (files: FileList) => void;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearAllFiles: () => void;
  maxFiles: number;
  maxFileSizeMB: number;
};

export const UploadSection: React.FC<UploadSectionProps> = ({
  files,
  selectedFileId,
  isLoading,
  onFilesAdded,
  onSelectFile,
  onRemoveFile,
  onClearAllFiles,
  maxFiles,
  maxFileSizeMB
}) => {
  return (
    <>
      <UploadArea 
        onFilesAdded={onFilesAdded} 
        isLoading={isLoading} 
        files={files}
        maxFiles={maxFiles}
        maxFileSizeMB={maxFileSizeMB}
        onClearAllFiles={onClearAllFiles}
      />
      <FilesList 
        files={files} 
        selectedFileId={selectedFileId} 
        onSelectFile={onSelectFile} 
        onRemoveFile={onRemoveFile} 
      />
    </>
  );
};
