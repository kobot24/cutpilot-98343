
import React from 'react';
import { Button } from '@/components/ui/button';
import { UploadArea } from '@/components/UploadArea';
import { FilesList } from '@/components/FilesList';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';

type UploadSectionProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  settings: UserSettings;
  conversionProgress: ConversionProgress;
  onFilesAdded: (files: FileList) => void;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearAllFiles: () => void;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  onBatchConvert?: (fileIds: string[]) => void;
  maxFiles: number;
  maxFileSizeMB: number;
};

export const UploadSection: React.FC<UploadSectionProps> = ({
  files,
  selectedFileId,
  isLoading,
  settings,
  conversionProgress,
  onFilesAdded,
  onSelectFile,
  onRemoveFile,
  onClearAllFiles,
  onConvertToPdf,
  onBatchConvert,
  maxFiles,
  maxFileSizeMB
}) => {
  // Batch convert handler that we'll pass to FilesList
  const handleBatchConvert = (fileIds: string[]) => {
    if (onBatchConvert) {
      onBatchConvert(fileIds);
    } else {
      // If no explicit batch handler is provided, convert files one by one
      fileIds.forEach(id => onConvertToPdf(id));
    }
  };

  return (
    <div className="space-y-6">
      <UploadArea 
        onFilesAdded={onFilesAdded} 
        isLoading={isLoading} 
        files={files}
        maxFiles={maxFiles}
        maxFileSizeMB={maxFileSizeMB}
        onClearAllFiles={onClearAllFiles}
      />
      
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-3">Hochgeladene Dateien</h2>
        <FilesList 
          files={files} 
          selectedFileId={selectedFileId} 
          onSelectFile={onSelectFile} 
          onRemoveFile={onRemoveFile}
          onConvertToPdf={onConvertToPdf}
          onBatchConvert={handleBatchConvert}
          settings={settings}
          isLoading={isLoading}
          conversionProgress={conversionProgress}
        />
      </div>
    </div>
  );
};
