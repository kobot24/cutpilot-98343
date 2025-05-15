
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { PDFConversionProgress } from '@/components/pdf/PDFConversionProgress';
import { ConversionProgress } from '@/hooks/usePDFConverter';

type FileInfoCardProps = {
  selectedFile: UploadedFile;
  settings: UserSettings;
  conversionInProgress: boolean;
  isLoading: boolean;
  onConvertClick: () => void;
  conversionProgress: ConversionProgress;
  conversionError: string | null;
};

export const FileInfoCard = ({
  selectedFile,
  settings,
  conversionInProgress,
  isLoading,
  onConvertClick,
  conversionProgress,
  conversionError
}: FileInfoCardProps) => {
  return (
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
            onClick={onConvertClick}
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
  );
};
