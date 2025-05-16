
import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { ContentRenderer } from '@/components/layout/ContentRenderer';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 w-full">
        <AppSidebar activeSection={activeSection} onNavigate={onNavigate} />
        
        <SidebarInset className="flex-1">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold capitalize">{activeSection}</h1>
            </div>
            
            {activeSection === 'upload' && files.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-500 hover:bg-red-50"
                onClick={clearAllFiles}
              >
                <Trash2 className="h-4 w-4 mr-1" /> 
                Alle Dateien löschen
              </Button>
            )}
          </header>
          
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
