
import React, { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFCutContour } from './PDFCutContour';
import { PDFPageIndicator } from './PDFPageIndicator';
import { toast } from '@/components/ui/use-toast';

// Ensure the worker is loaded before rendering any PDF components
// This needs to be set only once in the application
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PDFDocumentViewProps = {
  pdfUrl: string;
  fileName: string;
  showCutContour: boolean;
  pageNumber: number;
  numPages: number | null;
  handleDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  handlePageLoadSuccess: (page: any) => void;
  handleLoadError: (err: Error) => void;
  isLoading: boolean;
  error: string | null;
};

export const PDFDocumentView = ({ 
  pdfUrl, 
  fileName, 
  showCutContour, 
  pageNumber, 
  numPages,
  handleDocumentLoadSuccess,
  handlePageLoadSuccess,
  handleLoadError,
  isLoading,
  error
}: PDFDocumentViewProps) => {
  const [documentLoadAttempt, setDocumentLoadAttempt] = useState(0);

  // Memoize options to prevent unnecessary rerenders
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
  }), []);

  // Handle document loading error with retry
  const handleDocumentLoadError = (err: Error) => {
    console.error('PDF document load error:', err);
    
    // After 3 attempts, show the error permanently
    if (documentLoadAttempt >= 2) {
      toast({
        title: "PDF konnte nicht geladen werden",
        description: err.message || "Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
      handleLoadError(err);
      return;
    }
    
    // Retry loading
    setDocumentLoadAttempt(prev => prev + 1);
    
    // Show a retry message
    toast({
      title: "Lade PDF...",
      description: `Versuch ${documentLoadAttempt + 1}/3`,
    });
    
    // Small delay before retry
    setTimeout(() => {
      // This will trigger a re-render and attempt to load the document again
      handleLoadError(new Error("Lade erneut..."));
    }, 1000);
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {!error && (
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onError={handleDocumentLoadError}
          className="w-full h-full"
          loading={<div className="w-full h-full flex items-center justify-center">Lade PDF...</div>}
          error={<div className="w-full h-full flex items-center justify-center text-red-500">Fehler beim Laden des PDFs</div>}
          options={pdfOptions}
          key={`doc-${documentLoadAttempt}`} // Force re-render on retry
        >
          <Page 
            pageNumber={pageNumber} 
            width={window.innerWidth * 0.4}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="flex justify-center"
            onLoadSuccess={handlePageLoadSuccess}
            loading={<div className="w-full h-32 flex items-center justify-center">Lade Seite...</div>}
            error={<div className="text-red-500">Fehler beim Laden der Seite</div>}
          />
        </Document>
      )}
      
      <PDFCutContour fileName={fileName} show={showCutContour && !error && !isLoading} />
      <PDFPageIndicator pageNumber={pageNumber} numPages={numPages} />
    </>
  );
};
