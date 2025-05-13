
import React, { useState } from 'react';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PDFEmptyState } from './pdf/PDFEmptyState';
import { PDFControls } from './pdf/PDFControls';
import { PDFDimensionsDisplay } from './pdf/PDFDimensionsDisplay';
import { PDFDocumentView } from './pdf/PDFDocumentView';
import { PDFErrorDisplay } from './pdf/PDFErrorDisplay';
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

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
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
          />
        )}
      </div>
    </div>
  );
};
