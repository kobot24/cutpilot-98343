
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
    
    console.log(`Starting batch conversion of ${fileIds.length} files`);
    
    // Initialize batch conversion progress
    if (startBatchConversion && fileIds.length > 0) {
      const firstFile = files.find(f => f.id === fileIds[0]);
      startBatchConversion(fileIds.length, firstFile?.name || 'Unbekannte Datei');
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Important: Process files one by one in sequence, not just looping through IDs
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        console.log(`File with ID ${fileId} not found`);
        failCount++;
        continue;
      }
      
      console.log(`Converting file ${i + 1}/${fileIds.length}: ${file.name}`);
      
      // Update batch progress before conversion
      if (updateBatchProgress) {
        updateBatchProgress(i + 1, file.name, false);
      }
      
      try {
        // Wait for each conversion to complete before moving to the next
        const result = await convertToPdf(fileId);
        if (result) {
          successCount++;
          console.log(`Successfully converted ${file.name} to PDF`);
          if (updateBatchProgress) {
            updateBatchProgress(i + 1, file.name, true);
          }
        } else {
          failCount++;
          console.log(`Failed to convert ${file.name} to PDF`);
        }
      } catch (error) {
        console.error(`Error converting file ${fileId}:`, error);
        failCount++;
      }
    }
    
    console.log(`Batch conversion completed: ${successCount} successful, ${failCount} failed`);
    
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
