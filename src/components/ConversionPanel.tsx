
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';
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
};

export const ConversionPanel = ({
  selectedFile,
  onConvertToPdf,
  settings,
  isLoading,
  files,
  onSelectFile,
  onRemoveFile,
  conversionProgress = { progress: 0, status: '' }
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
    
    setBatchConversionInProgress(true);
    let successCount = 0;
    let failCount = 0;
    
    toast({
      title: "Batch-Konvertierung gestartet",
      description: `${fileIds.length} Dateien werden zu PDF konvertiert...`
    });
    
    try {
      // Convert files sequentially to avoid memory issues
      for (const fileId of fileIds) {
        try {
          const result = await onConvertToPdf(fileId);
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
      
      toast({
        title: "Batch-Konvertierung abgeschlossen",
        description: `${successCount} von ${fileIds.length} Dateien erfolgreich konvertiert${failCount > 0 ? `, ${failCount} fehlgeschlagen` : ''}`
      });
    } finally {
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
