
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFCutContour } from './pdf/PDFCutContour';
import { PDFPageIndicator } from './pdf/PDFPageIndicator';

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
  const [scale, setScale] = useState<number>(0.5); // Start with a smaller default scale
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });

  // Calculate the appropriate scale when the container size changes or when PDF dimensions are available
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const containerWidth = containerRef.current?.clientWidth || 0;
      const containerHeight = containerRef.current?.clientHeight || 0;
      
      if (containerWidth > 0 && pdfSize.width > 0) {
        // Get available space with some padding
        const availableWidth = containerWidth - 40; // 20px padding on each side
        const availableHeight = containerHeight - 40;
        
        // Calculate scale factors for both dimensions
        const scaleX = availableWidth / pdfSize.width;
        const scaleY = availableHeight / pdfSize.height;
        
        // Use the smaller scale to ensure PDF fits completely
        const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to prevent too much enlargement
        
        setScale(newScale);
      }
    };

    // Set initial scale
    updateScale();

    // Update scale on resize
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [pdfSize]);

  // Update PDF dimensions when page loads successfully
  const handlePageLoad = (page: any) => {
    if (page && page.width && page.height) {
      setPdfSize({
        width: page.width,
        height: page.height
      });
    }
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
