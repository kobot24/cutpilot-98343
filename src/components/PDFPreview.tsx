
import React, { useState } from 'react';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PDFEmptyState } from './pdf/PDFEmptyState';
import { PDFControls } from './pdf/PDFControls';
import { PDFDimensionsDisplay } from './pdf/PDFDimensionsDisplay';
import { PDFDocumentView } from './pdf/PDFDocumentView';
import { PDFErrorDisplay } from './pdf/PDFErrorDisplay';
import { toast } from '@/components/ui/use-toast';
import { isTauri } from '@/utils/tauri';
import { saveFileDialog, writeBinaryFile, getDownloadDir } from '@/utils/tauriFileDialog';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

type PDFPreviewProps = {
  pdfUrl: string;
  fileName: string;
};

export const PDFPreview = ({ pdfUrl, fileName }: PDFPreviewProps) => {
  const [showCutContour, setShowCutContour] = useState<boolean>(true);
  const [downloadAttempt, setDownloadAttempt] = useState(0);
  
  const {
    numPages,
    pageNumber,
    isLoading,
    error,
    pdfDimensions,
    handleDocumentLoadSuccess,
    handlePageLoadSuccess,
    handleLoadError,
    retryLoading
  } = usePDFLoader({ pdfUrl });

  const handleDownload = async () => {
    try {
      // Check if this is a data URL or a blob URL
      if (!pdfUrl) {
        toast({
          title: "Fehler beim Speichern",
          description: "Keine gültige PDF-Datei zum Speichern verfügbar",
          variant: "destructive"
        });
        return;
      }

      // Generate download filename
      const downloadName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // Fetch PDF data as ArrayBuffer
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Use Tauri save dialog if in desktop mode
      if (isTauri()) {
        const downloadDir = await getDownloadDir();
        const defaultPath = downloadDir ? `${downloadDir}/${downloadName}` : downloadName;

        const filePath = await saveFileDialog({
          defaultPath,
          filters: [
            {
              name: 'PDF Dateien',
              extensions: ['pdf']
            }
          ]
        });

        if (filePath) {
          const success = await writeBinaryFile(filePath, uint8Array);
          if (success) {
            toast({
              title: "PDF gespeichert",
              description: `Datei wurde erfolgreich gespeichert`
            });
            setDownloadAttempt(prev => prev + 1);
          } else {
            throw new Error('Fehler beim Speichern der Datei');
          }
        } else {
          // User cancelled
          toast({
            title: "Abgebrochen",
            description: "Speichern abgebrochen"
          });
        }
      } else {
        // Browser fallback - direct download
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        toast({
          title: "Download gestartet",
          description: `${downloadName} wird heruntergeladen`
        });
        setDownloadAttempt(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: "Fehler beim Speichern",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
      handleLoadError(new Error('Fehler beim Speichern'));
    }
  };

  const toggleCutContour = () => {
    setShowCutContour(!showCutContour);
  };

  // If the PDF URL is empty or invalid, show a helpful message
  if (!pdfUrl) {
    return <PDFEmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          PDF Vorschau 
          <PDFDimensionsDisplay fileName={fileName} pdfDimensions={pdfDimensions} />
        </h3>
        <PDFControls 
          showCutContour={showCutContour} 
          toggleCutContour={toggleCutContour} 
          handleDownload={handleDownload} 
          downloadDisabled={isLoading || !!error}
        />
      </div>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
        {error ? (
          <PDFErrorDisplay error={error} retryLoading={retryLoading} />
        ) : (
          <PDFDocumentView
            pdfUrl={pdfUrl}
            fileName={fileName}
            showCutContour={showCutContour}
            pageNumber={pageNumber}
            numPages={numPages}
            handleDocumentLoadSuccess={handleDocumentLoadSuccess}
            handlePageLoadSuccess={handlePageLoadSuccess}
            handleLoadError={handleLoadError}
            isLoading={isLoading}
            error={error}
            key={`pdf-view-${downloadAttempt}`} // Force remount after download attempts
          />
        )}
      </div>
    </div>
  );
};
