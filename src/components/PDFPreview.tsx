
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Set up the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PDFPreviewProps = {
  pdfUrl: string;
  fileName: string;
};

export const PDFPreview = ({ pdfUrl, fileName }: PDFPreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCutContour, setShowCutContour] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track when PDF URL changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [pdfUrl]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handleLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(`Fehler beim Laden: ${err.message}`);
    setIsLoading(false);
  };

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
      setError('Fehler beim Herunterladen');
    }
  };

  const toggleCutContour = () => {
    setShowCutContour(!showCutContour);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">PDF Vorschau</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleCutContour}
          >
            {showCutContour ? 'CutContour ausblenden' : 'CutContour einblenden'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload}
          >
            Herunterladen
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-red-500 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-center mb-2">{error}</p>
            <p className="text-sm text-gray-600 text-center">
              Hinweis: Das PDF könnte möglicherweise nicht mit Adobe Illustrator kompatibel sein. Versuchen Sie, es mit Adobe Reader zu öffnen.
            </p>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onError={handleLoadError}
            className="w-full h-full"
            loading={<div className="w-full h-full flex items-center justify-center">Lade PDF...</div>}
            error={<div className="w-full h-full flex items-center justify-center text-red-500">Fehler beim Laden des PDFs</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              width={window.innerWidth * 0.4}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="flex justify-center"
            />
          </Document>
        )}
        
        {showCutContour && !error && !isLoading && (
          <>
            <div className="absolute inset-0 pointer-events-none border-4 border-red-500 border-dashed m-8 opacity-50" />
            <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-red-500 font-medium">
              {fileName.split('.').slice(0, -1).join('.')} - CutContour (Spotfarbe)
            </div>
          </>
        )}
        
        {numPages && numPages > 1 && (
          <div className="absolute bottom-2 left-2 bg-white/80 text-xs px-2 py-1 rounded">
            Seite {pageNumber} von {numPages}
          </div>
        )}
      </div>
    </div>
  );
};
