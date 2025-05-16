import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { BatchConversionProgress, ConversionProgress } from '@/hooks/usePDFConverter';
import { FileCard } from './files/FileCard';
import { FilesEmptyState } from './files/FilesEmptyState';
import { FilesListHeader } from './files/FilesListHeader';
import { BatchConversionProgress as BatchProgressComponent } from './pdf/BatchConversionProgress';

type FilesListProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  onBatchConvert?: (fileIds: string[]) => void;
  settings: UserSettings;
  isLoading: boolean;
  conversionProgress: ConversionProgress;
  batchProgress?: BatchConversionProgress;
};

export const FilesList = ({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
  onConvertToPdf,
  onBatchConvert,
  settings,
  isLoading,
  conversionProgress,
  batchProgress
}: FilesListProps) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Record<string, boolean>>({});
  
  const handleCheckboxClick = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };
  
  const handleBatchConvert = () => {
    if (onBatchConvert && selectedFiles.length > 0) {
      onBatchConvert(selectedFiles);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      // If all files are selected, deselect all
      setSelectedFiles([]);
    } else {
      // Otherwise, select all files
      setSelectedFiles(files.map(file => file.id));
    }
  };

  if (files.length === 0) {
    return <FilesEmptyState />;
  }

  return (
    <div className="space-y-4">
      {batchProgress && batchProgress.isActive && (
        <BatchProgressComponent progress={batchProgress} />
      )}
      
      <FilesListHeader 
        filesCount={files.length}
        selectedFilesCount={selectedFiles.length}
        onSelectAll={handleSelectAll}
        onBatchConvert={handleBatchConvert}
        isAllSelected={selectedFiles.length === files.length}
        isLoading={isLoading || (batchProgress?.isActive || false)}
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={selectedFileId === file.id}
            onSelect={onSelectFile}
            onRemove={onRemoveFile}
            onConvertToPdf={onConvertToPdf}
            settings={settings}
            isProcessing={processingFiles[file.id] || false}
            isGlobalLoading={isLoading}
            onCheckboxClick={handleCheckboxClick}
            isCheckboxSelected={selectedFiles.includes(file.id)}
            isBatchProcessing={batchProgress?.isActive || false}
          />
        ))}
      </div>
    </div>
  );
};
