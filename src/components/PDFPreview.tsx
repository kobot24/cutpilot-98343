
import React, { useState, useEffect } from 'react';
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

  // Always show download button even if PDF fails to load in viewer
  const [pdfUrlForDownload, setPdfUrlForDownload] = useState<string>(pdfUrl);
  
  // Update download URL when pdfUrl changes
  useEffect(() => {
    if (pdfUrl && pdfUrl !== 'data:application/pdf;base64,') {
      setPdfUrlForDownload(pdfUrl);
      console.log('PDF URL available for download:', !!pdfUrl);
    }
  }, [pdfUrl]);

  const handleDownload = () => {
    try {
      console.log('Downloading PDF:', pdfUrlForDownload, fileName);
      
      // For large files, create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = pdfUrlForDownload;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download gestartet",
        description: `${fileName} wird heruntergeladen`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download fehlgeschlagen",
        description: "Fehler beim Herunterladen der Datei",
        variant: "destructive",
      });
      handleLoadError(new Error('Fehler beim Herunterladen'));
    }
  };

  const toggleCutContour = () => {
    setShowCutContour(!showCutContour);
  };

  // If the PDF URL is empty or invalid, show a helpful message
  if (!pdfUrl || pdfUrl === 'data:application/pdf;base64,') {
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
        />
      </div>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
        {error ? (
          <div className="flex flex-col">
            <PDFErrorDisplay error={error} retryLoading={retryLoading} />
            {/* Even if the preview fails, show a download button for large files */}
            {pdfUrlForDownload && (
              <div className="p-4 flex justify-center">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Herunterladen
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
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
            />
          </div>
        )}
      </div>
    </div>
  );
};
