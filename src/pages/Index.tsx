
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
    conversionProgress,
    batchProgress,
    startBatchConversion,
    updateBatchProgress,
    endBatchConversion
  } = useFileStorage();
  
  const { settings, updateSettings } = useSettings();

  // Function to batch convert multiple files
  const handleBatchConvert = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    // Initialize batch conversion progress
    if (startBatchConversion && fileIds.length > 0) {
      const firstFile = files.find(f => f.id === fileIds[0]);
      startBatchConversion(fileIds.length, firstFile?.name || 'Unbekannte Datei');
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        failCount++;
        continue;
      }
      
      // Update batch progress
      if (updateBatchProgress) {
        updateBatchProgress(i + 1, file.name, false);
      }
      
      try {
        const result = await convertToPdf(fileId);
        if (result) {
          successCount++;
          if (updateBatchProgress) {
            updateBatchProgress(i + 1, file.name, true);
          }
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error converting file ${fileId}:`, error);
        failCount++;
      }
    }
    
    // End batch conversion
    if (endBatchConversion) {
      endBatchConversion();
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
        batchProgress={batchProgress}
        maxFiles={MAX_FILES}
        maxFileSizeMB={MAX_FILE_SIZE_MB}
        addFiles={addFiles}
        removeFile={removeFile}
        selectFile={selectFile}
        convertToPdf={convertToPdf}
        clearAllFiles={clearAllFiles}
        updateSettings={updateSettings}
        onBatchConvert={handleBatchConvert}
        startBatchConversion={startBatchConversion}
        updateBatchProgress={updateBatchProgress}
        endBatchConversion={endBatchConversion}
      />
      <Toaster />
    </>
  );
};

export default Index;
