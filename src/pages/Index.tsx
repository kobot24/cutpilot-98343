
import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { UploadArea } from '@/components/UploadArea';
import { FilesList } from '@/components/FilesList';
import { ConversionPanel } from '@/components/ConversionPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { PrintPlateCanvas } from '@/components/PrintPlateCanvas';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useSettings } from '@/hooks/useSettings';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeSection, setActiveSection] = useState('upload');
  const { 
    files, 
    selectedFile, 
    isLoading, 
    addFiles, 
    removeFile, 
    selectFile, 
    convertToPdf,
    clearAllFiles,
    MAX_FILE_SIZE_MB,
    MAX_FILES,
    conversionProgress
  } = useFileStorage();
  
  const { settings, updateSettings } = useSettings();

  // Handle navigation between sidebar sections
  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return (
          <>
            <div className="flex justify-between mb-4">
              <div></div> {/* Empty div for spacing */}
              {files.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearAllFiles}
                  size="sm"
                  className="text-red-500 hover:bg-red-50"
                >
                  Alle Dateien löschen
                </Button>
              )}
            </div>
            <UploadArea 
              onFilesAdded={addFiles} 
              isLoading={isLoading} 
              files={files}
              maxFiles={MAX_FILES}
              maxFileSizeMB={MAX_FILE_SIZE_MB}
            />
            <FilesList 
              files={files} 
              selectedFileId={selectedFile?.id || null} 
              onSelectFile={selectFile} 
              onRemoveFile={removeFile}
            />
          </>
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onNavigate={handleNavigate} activeSection={activeSection} />
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
