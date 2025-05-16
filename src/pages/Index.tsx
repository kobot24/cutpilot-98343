
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
    batchConvertToPdf, // Use the new batch function
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

  // Function to batch convert multiple files - simplified since the logic now happens in usePDFOperations
  const handleBatchConvert = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    console.log(`Index: Delegating batch conversion of ${fileIds.length} files`);
    await batchConvertToPdf(fileIds);
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
