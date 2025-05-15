
import React from 'react';
import { UploadSection } from '@/components/upload/UploadSection';
import { ConversionPanel } from '@/components/ConversionPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { PrintPlateCanvas } from '@/components/PrintPlateCanvas';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';

type ContentRendererProps = {
  activeSection: string;
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  isLoading: boolean;
  settings: UserSettings;
  conversionProgress: ConversionProgress;
  maxFiles: number;
  maxFileSizeMB: number;
  addFiles: (files: FileList) => void;
  removeFile: (id: string) => void;
  selectFile: (id: string) => void;
  convertToPdf: (fileId: string) => Promise<string | undefined>;
  clearAllFiles: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  activeSection,
  files,
  selectedFile,
  isLoading,
  settings,
  conversionProgress,
  maxFiles,
  maxFileSizeMB,
  addFiles,
  removeFile,
  selectFile,
  convertToPdf,
  clearAllFiles,
  updateSettings
}) => {
  switch (activeSection) {
    case 'upload':
      return (
        <UploadSection
          files={files}
          selectedFileId={selectedFile?.id || null}
          isLoading={isLoading}
          onFilesAdded={addFiles}
          onSelectFile={selectFile}
          onRemoveFile={removeFile}
          onClearAllFiles={clearAllFiles}
          maxFiles={maxFiles}
          maxFileSizeMB={maxFileSizeMB}
        />
      );
    case 'files':
      return (
        <ConversionPanel 
          selectedFile={selectedFile} 
          onConvertToPdf={convertToPdf}
          settings={settings}
          isLoading={isLoading}
          conversionProgress={conversionProgress}
        />
      );
    case 'settings':
      return (
        <SettingsPanel 
          settings={settings} 
          onUpdateSettings={updateSettings}
        />
      );
    case 'printplate':
      return (
        <PrintPlateCanvas files={files} />
      );
    default:
      return <div>Abschnitt nicht gefunden</div>;
  }
};
