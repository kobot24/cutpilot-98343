
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { BatchConversionProgress, ConversionProgress } from '@/hooks/usePDFConverter';
import { NoFileSelected } from './conversion/NoFileSelected';
import { FileInfoCard } from './conversion/FileInfoCard';
import { ConversionHeader } from './conversion/ConversionHeader';
import { FilesList } from './FilesList';

type ConversionPanelProps = {
  selectedFile: UploadedFile | null;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  settings: UserSettings;
  isLoading: boolean;
  files: UploadedFile[];
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  conversionProgress?: ConversionProgress;
  batchProgress?: BatchConversionProgress;
  startBatchConversion?: (totalFiles: number, firstFileName: string) => void;
  updateBatchProgress?: (currentFileIndex: number, fileName: string, success: boolean) => void;
  endBatchConversion?: () => void;
};

export const ConversionPanel = ({
  selectedFile,
  onConvertToPdf,
  settings,
  isLoading,
  files,
  onSelectFile,
  onRemoveFile,
  conversionProgress = { progress: 0, status: '' },
  batchProgress,
  startBatchConversion,
  updateBatchProgress,
  endBatchConversion
}: ConversionPanelProps) => {
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [batchConversionInProgress, setBatchConversionInProgress] = useState(false);

  const handleConvert = async () => {
    if (!selectedFile) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie zuerst eine Datei aus",
        variant: "destructive"
      });
      return;
    }

    try {
      setConversionInProgress(true);
      setConversionError(null);
      
      // Show a processing toast
      toast({
        title: "PDF wird erstellt",
        description: "Bitte warten Sie, während die PDF erstellt wird..."
      });
      
      const pdfUrl = await onConvertToPdf(selectedFile.id);
      
      if (pdfUrl) {
        toast({
          title: "PDF erstellt",
          description: "PDF mit CutContour wurde erfolgreich erstellt"
        });
      } else {
        throw new Error("Keine PDF-URL zurückgegeben");
      }
    } catch (error) {
      console.error("PDF conversion error:", error);
      setConversionError(error instanceof Error ? error.message : "Unbekannter Fehler");
      toast({
        title: "Fehler bei der PDF-Erstellung",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setConversionInProgress(false);
    }
  };
  
  const handleBatchConvert = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    console.log(`ConversionPanel: Starting batch conversion of ${fileIds.length} files`);
    setBatchConversionInProgress(true);
    let successCount = 0;
    let failCount = 0;
    
    // Initialize batch progress
    if (startBatchConversion && fileIds.length > 0) {
      const firstFile = files.find(f => f.id === fileIds[0]);
      startBatchConversion(fileIds.length, firstFile?.name || 'Unbekannte Datei');
    }
    
    toast({
      title: "Batch-Konvertierung gestartet",
      description: `${fileIds.length} Dateien werden zu PDF konvertiert...`
    });
    
    try {
      // Convert files sequentially to avoid memory issues
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i];
        const file = files.find(f => f.id === fileId);
        
        if (!file) {
          console.log(`ConversionPanel: File with ID ${fileId} not found`);
          failCount++;
          continue;
        }
        
        console.log(`ConversionPanel: Converting file ${i + 1}/${fileIds.length}: ${file.name}`);
        
        // Update batch progress
        if (updateBatchProgress) {
          updateBatchProgress(i + 1, file.name, false);
        }
        
        try {
          // Important: Wait for each conversion to complete
          const result = await onConvertToPdf(fileId);
          if (result) {
            successCount++;
            console.log(`ConversionPanel: Successfully converted ${file.name} to PDF`);
            if (updateBatchProgress) {
              updateBatchProgress(i + 1, file.name, true);
            }
          } else {
            failCount++;
            console.log(`ConversionPanel: Failed to convert ${file.name} to PDF`);
          }
        } catch (error) {
          console.error(`ConversionPanel: Error converting file ${fileId}:`, error);
          failCount++;
        }
      }
      
      console.log(`ConversionPanel: Batch conversion completed: ${successCount} successful, ${failCount} failed`);
      
      toast({
        title: "Batch-Konvertierung abgeschlossen",
        description: `${successCount} von ${fileIds.length} Dateien erfolgreich konvertiert${failCount > 0 ? `, ${failCount} fehlgeschlagen` : ''}`
      });
    } finally {
      if (endBatchConversion) {
        endBatchConversion();
      }
      setBatchConversionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConversionHeader />

      <FilesList 
        files={files}
        selectedFileId={selectedFile?.id || null}
        onSelectFile={onSelectFile}
        onRemoveFile={onRemoveFile}
        onBatchConvert={handleBatchConvert}
        settings={settings}
        onConvertToPdf={onConvertToPdf}
        isLoading={isLoading || batchConversionInProgress}
        conversionProgress={conversionProgress}
        batchProgress={batchProgress}
      />

      {selectedFile && (
        <div className="max-w-md mx-auto">
          <FileInfoCard
            selectedFile={selectedFile}
            settings={settings}
            conversionInProgress={conversionInProgress || batchConversionInProgress}
            isLoading={isLoading}
            onConvertClick={handleConvert}
            conversionProgress={conversionProgress}
            conversionError={conversionError}
          />
        </div>
      )}
    </div>
  );
};
