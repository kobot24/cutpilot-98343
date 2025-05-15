
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFCutContour } from './PDFCutContour';
import { PDFPageIndicator } from './PDFPageIndicator';

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
  // Memoize options to prevent unnecessary rerenders
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
  }), []);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set scale to 1.0 (100% of original size) to match the exact dimensions
  const [scale, setScale] = useState<number>(1.0);

  // Update PDF dimensions when page loads successfully
  const handlePageLoad = (page: any) => {
    handlePageLoadSuccess(page);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {!error && (
        <div className="flex justify-center items-center w-full h-full">
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onError={handleLoadError}
            className="w-full h-full"
            loading={<div className="w-full h-full flex items-center justify-center">Lade PDF...</div>}
            error={<div className="w-full h-full flex items-center justify-center text-red-500">Fehler beim Laden des PDFs</div>}
            options={pdfOptions}
          >
            <div className="flex justify-center items-center min-h-full p-4">
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={handlePageLoad}
                loading={<div className="w-full h-32 flex items-center justify-center">Lade Seite...</div>}
                error={<div className="text-red-500">Fehler beim Laden der Seite</div>}
                className="shadow-md"
              />
            </div>
          </Document>
        </div>
      )}
      
      <PDFCutContour fileName={fileName} show={showCutContour && !error && !isLoading} />
      <PDFPageIndicator pageNumber={pageNumber} numPages={numPages} />
    </div>
  );
};
