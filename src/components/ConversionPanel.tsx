
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';
import { NoFileSelected } from './conversion/NoFileSelected';
import { FileInfoCard } from './conversion/FileInfoCard';
import { PDFPreviewCard } from './conversion/PDFPreviewCard';
import { ConversionHeader } from './conversion/ConversionHeader';

type ConversionPanelProps = {
  selectedFile: UploadedFile | null;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  settings: UserSettings;
  isLoading: boolean;
  conversionProgress?: ConversionProgress;
};

export const ConversionPanel = ({
  selectedFile,
  onConvertToPdf,
  settings,
  isLoading,
  conversionProgress = { progress: 0, status: '' }
}: ConversionPanelProps) => {
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

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
        setShowPreview(true);
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

  if (!selectedFile) {
    return <NoFileSelected />;
  }

  return (
    <div className="space-y-6">
      <ConversionHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FileInfoCard
          selectedFile={selectedFile}
          settings={settings}
          conversionInProgress={conversionInProgress}
          isLoading={isLoading}
          onConvertClick={handleConvert}
          conversionProgress={conversionProgress}
          conversionError={conversionError}
        />

        <PDFPreviewCard 
          selectedFile={selectedFile} 
          showPreview={showPreview} 
        />
      </div>
    </div>
  );
};
