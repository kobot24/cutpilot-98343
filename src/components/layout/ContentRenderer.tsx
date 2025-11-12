
import React from 'react';
import { UploadSection } from '@/components/upload/UploadSection';
import { Settings } from '@/pages/Settings';
import { PrintPlateCanvas } from '@/components/PrintPlateCanvas';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { BatchConversionProgress, ConversionProgress } from '@/hooks/usePDFConverter';

type ContentRendererProps = {
  activeSection: string;
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  isLoading: boolean;
  settings: UserSettings;
  conversionProgress: ConversionProgress;
  batchProgress?: BatchConversionProgress;
  maxFiles: number;
  maxFileSizeMB: number;
  addFiles: (files: FileList) => void;
  removeFile: (id: string) => void;
  selectFile: (id: string) => void;
  convertToPdf: (fileId: string) => Promise<string | undefined>;
  clearAllFiles: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  onBatchConvert?: (fileIds: string[]) => void;
  startBatchConversion?: (totalFiles: number, firstFileName: string) => void;
  updateBatchProgress?: (currentFileIndex: number, fileName: string, success: boolean) => void;
  endBatchConversion?: () => void;
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  activeSection,
  files,
  selectedFile,
  isLoading,
  settings,
  conversionProgress,
  batchProgress,
  maxFiles,
  maxFileSizeMB,
  addFiles,
  removeFile,
  selectFile,
  convertToPdf,
  clearAllFiles,
  updateSettings,
  onBatchConvert,
  startBatchConversion,
  updateBatchProgress,
  endBatchConversion
}) => {
  switch (activeSection) {
    case 'upload':
      return (
        <UploadSection
          files={files}
          selectedFileId={selectedFile?.id || null}
          isLoading={isLoading}
          settings={settings}
          conversionProgress={conversionProgress}
          batchProgress={batchProgress}
          onFilesAdded={addFiles}
          onSelectFile={selectFile}
          onRemoveFile={removeFile}
          onClearAllFiles={clearAllFiles}
          onConvertToPdf={convertToPdf}
          onBatchConvert={onBatchConvert}
          maxFiles={maxFiles}
          maxFileSizeMB={maxFileSizeMB}
        />
      );
    case 'settings':
      return <Settings />;
    case 'printplate':
      return (
        <PrintPlateCanvas files={files} />
      );
    default:
      return <div>Abschnitt nicht gefunden</div>;
  }
};
