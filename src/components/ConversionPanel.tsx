
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { PDFPreview } from './PDFPreview';
import { AspectRatio } from './ui/aspect-ratio';

type ConversionPanelProps = {
  selectedFile: UploadedFile | null;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  settings: UserSettings;
  isLoading: boolean;
};

export const ConversionPanel = ({
  selectedFile,
  onConvertToPdf,
  settings,
  isLoading
}: ConversionPanelProps) => {
  const [conversionInProgress, setConversionInProgress] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Bitte wählen Sie zuerst eine Datei aus');
      return;
    }

    try {
      setConversionInProgress(true);
      await onConvertToPdf(selectedFile.id);
      toast.success('PDF mit CutContour erstellt');
      setShowPreview(true);
    } catch (error) {
      toast.error('Fehler bei der PDF-Erstellung');
      console.error(error);
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

      {/* Large preview section at the top */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Original image with settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Original</h3>
              <AspectRatio ratio={1} className="bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="object-contain w-full h-full"
                />
              </AspectRatio>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Dateiname:</span>{' '}
                  <span className="text-gray-600">{selectedFile.name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Größe:</span>{' '}
                  <span className="text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">CutContour-Abstand:</span>{' '}
                  <span className="text-gray-600">{settings.cutContourOffset} mm</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Spotfarbe:</span>{' '}
                  <span className="text-gray-600">{settings.spotColorName}</span>
                </div>
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
              </div>
            </div>

            {/* Right side - PDF preview (takes 2/3 of the space on large screens) */}
            <div className="lg:col-span-2 h-full min-h-[400px]">
              {selectedFile.convertedPdfUrl ? (
                <PDFPreview 
                  pdfUrl={selectedFile.convertedPdfUrl} 
                  fileName={selectedFile.name.replace(/\.[^/.]+$/, '.pdf')}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md p-6">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File grid at the bottom */}
      <div>
        <h3 className="text-lg font-medium mb-4">Alle Uploads</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.isArray(window.uploadedFiles) && window.uploadedFiles.length > 0 ? 
            window.uploadedFiles.map((file: UploadedFile) => (
              <Card 
                key={file.id} 
                className={`cursor-pointer overflow-hidden ${
                  selectedFile.id === file.id ? 'border-blue-500 ring-2 ring-blue-200' : ''
                }`}
                onClick={() => window.selectFile(file.id)}
              >
                <AspectRatio ratio={1} className="bg-gray-100">
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className="object-contain w-full h-full"
                  />
                  {file.convertedPdfUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      PDF
                    </div>
                  )}
                </AspectRatio>
                <CardContent className="p-2">
                  <p className="truncate text-xs">{file.name}</p>
                </CardContent>
              </Card>
            ))
            :
            <div className="col-span-full text-center text-gray-400 py-8">
              Keine Dateien hochgeladen
            </div>
          }
        </div>
      </div>
    </div>
  );
};
