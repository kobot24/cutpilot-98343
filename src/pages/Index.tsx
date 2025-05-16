
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useSettings } from '@/hooks/useSettings';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  // Default to the upload section since it now includes conversion
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

  // Function to batch convert multiple files
  const handleBatchConvert = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;
    
    for (const fileId of fileIds) {
      try {
        const result = await convertToPdf(fileId);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error converting file ${fileId}:`, error);
        failCount++;
      }
    }
  };

  // Handle navigation between sidebar sections
  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  return (
    <>
      <MainLayout 
        activeSection={activeSection}
        onNavigate={handleNavigate}
        files={files}
        selectedFile={selectedFile}
        isLoading={isLoading}
        settings={settings}
        conversionProgress={conversionProgress}
        maxFiles={MAX_FILES}
        maxFileSizeMB={MAX_FILE_SIZE_MB}
        addFiles={addFiles}
        removeFile={removeFile}
        selectFile={selectFile}
        convertToPdf={convertToPdf}
        clearAllFiles={clearAllFiles}
        updateSettings={updateSettings}
        onBatchConvert={handleBatchConvert}
      />
      <Toaster />
    </>
  );
};

export default Index;
