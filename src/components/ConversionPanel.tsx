
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { PDFPreview } from './PDFPreview';
import { PDFDownloadButton } from './pdf/PDFDownloadButton';
import { ConversionProgress } from '@/hooks/usePDFConverter';
import { PDFConversionProgress } from './pdf/PDFConversionProgress';

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
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium">Keine Datei ausgewählt</h3>
        <p className="text-sm">Wählen Sie eine Datei aus der Dateigalerie</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dateien & Konvertierung</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="aspect-square relative bg-gray-100">
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium truncate">{selectedFile.name}</h3>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">CutContour-Abstand:</span>{' '}
                <span className="text-gray-600">{settings.cutContourOffset} mm</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Spotfarbe:</span>{' '}
                <span className="text-gray-600">{settings.spotColorName}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleConvert}
                disabled={isLoading || conversionInProgress}
              >
                {isLoading || conversionInProgress ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verarbeitung...
                  </span>
                ) : 'PDF mit CutContour erstellen'}
              </Button>
              
              <PDFConversionProgress 
                progress={conversionProgress} 
                show={conversionInProgress || conversionProgress.progress > 0} 
              />
              
              {selectedFile.convertedPdfUrl && (
                <PDFDownloadButton
                  pdfUrl={selectedFile.convertedPdfUrl}
                  fileName={selectedFile.name.replace(/\.[^/.]+$/, '.pdf')}
                  variant="outline"
                />
              )}
            </div>
            
            {conversionError && (
              <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                <strong>Fehler:</strong> {conversionError}
                <p className="mt-1 text-xs text-red-600">
                  Tipp: Bei großen Bildern kann es zu Problemen kommen. Versuchen Sie, das Bild zu verkleinern.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`overflow-hidden ${!selectedFile.convertedPdfUrl && !showPreview ? 'hidden lg:block' : ''}`}>
          <CardContent className="p-4 h-full flex flex-col">
            {selectedFile.convertedPdfUrl ? (
              <PDFPreview 
                pdfUrl={selectedFile.convertedPdfUrl} 
                fileName={selectedFile.name.replace(/\.[^/.]+$/, '.pdf')}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium">PDF Vorschau</h3>
                <p className="text-sm">PDF wird nach der Konvertierung hier angezeigt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

