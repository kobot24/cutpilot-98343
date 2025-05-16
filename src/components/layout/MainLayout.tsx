
import React from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ContentRenderer } from '@/components/layout/ContentRenderer';
import { SidebarProvider } from '@/components/ui/sidebar';
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
  onBatchConvert?: (fileIds: string[]) => void;
};

export const MainLayout = (props: MainLayoutProps) => {
  const { activeSection, onNavigate } = props;
  
  return (
    <SidebarProvider collapsedWidth={56}>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeSection={activeSection} onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <ContentRenderer {...props} />
        </div>
      </div>
    </SidebarProvider>
  );
};
