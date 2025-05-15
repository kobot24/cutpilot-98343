
import React, { useState } from 'react';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PDFEmptyState } from './pdf/PDFEmptyState';
import { PDFControls } from './pdf/PDFControls';
import { PDFDimensionsDisplay } from './pdf/PDFDimensionsDisplay';
import { PDFDocumentView } from './pdf/PDFDocumentView';
import { PDFErrorDisplay } from './pdf/PDFErrorDisplay';
import { toast } from '@/components/ui/use-toast';
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

  const handleDownload = () => {
    try {
      // Check if this is a data URL or a blob URL
      if (!pdfUrl) {
        toast({
          title: "Fehler beim Herunterladen",
          description: "Keine gültige PDF-Datei zum Herunterladen verfügbar",
          variant: "destructive"
        });
        return;
      }
      
      // Generate download filename
      const downloadName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      
      // For blob URLs, we can directly trigger download
      if (pdfUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      // For data URLs, we might need to handle large files differently
      else if (pdfUrl.startsWith('data:application/pdf;base64,')) {
        // If the dataURL is too long, it might cause issues
        if (pdfUrl.length > 10000000) { // ~10MB as string length estimate 
          // Convert data URL to Blob
          const base64 = pdfUrl.split(',')[1];
          const byteCharacters = atob(base64);
          const byteArrays = [];
          
          // Split into chunks to avoid memory issues
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          const blob = new Blob(byteArrays, {type: 'application/pdf'});
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
          // For smaller data URLs, direct download works fine
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast({
          title: "Fehler beim Herunterladen",
          description: "Ungültiges PDF-Format",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Download gestartet",
        description: `${downloadName} wird heruntergeladen`
      });
      setDownloadAttempt(prev => prev + 1);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Fehler beim Herunterladen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
      handleLoadError(new Error('Fehler beim Herunterladen'));
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
