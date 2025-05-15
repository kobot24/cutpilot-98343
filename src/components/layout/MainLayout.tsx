
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ContentRenderer } from '@/components/layout/ContentRenderer';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';

type MainLayoutProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
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

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeSection,
  onNavigate,
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
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onNavigate={onNavigate} activeSection={activeSection} />
      <main className="flex-1 overflow-auto p-6">
        <ContentRenderer 
          activeSection={activeSection}
          files={files}
          selectedFile={selectedFile}
          isLoading={isLoading}
          settings={settings}
          conversionProgress={conversionProgress}
          maxFiles={maxFiles}
          maxFileSizeMB={maxFileSizeMB}
          addFiles={addFiles}
          removeFile={removeFile}
          selectFile={selectFile}
          convertToPdf={convertToPdf}
          clearAllFiles={clearAllFiles}
          updateSettings={updateSettings}
        />
      </main>
    </div>
  );
};
