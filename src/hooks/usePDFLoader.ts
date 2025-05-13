
import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type UsePDFLoaderProps = {
  pdfUrl: string;
};

export const usePDFLoader = ({ pdfUrl }: UsePDFLoaderProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number, height: number } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState<number>(0);

  // Track when PDF URL changes
  useEffect(() => {
    console.log("PDF URL changed:", pdfUrl ? "Valid URL" : "Empty URL");
    setIsLoading(true);
    setError(null);
    // Reset the load attempt counter when URL changes
    setLoadAttempt(0);
  }, [pdfUrl]);

  // If loading fails, retry a few times (helpful for blob URLs that might take time)
  useEffect(() => {
    if (error && loadAttempt < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying PDF load (attempt ${loadAttempt + 1})`);
        setError(null);
        setIsLoading(true);
        setLoadAttempt(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [error, loadAttempt]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handlePageLoadSuccess = (page: any) => {
    // Get PDF dimensions from the loaded page
    if (page && page.width && page.height) {
      console.log(`PDF page dimensions: ${page.width}x${page.height} pt`);
      setPdfDimensions({
        width: page.width,
        height: page.height
      });
    }
  };

  const handleLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(`Fehler beim Laden: ${err.message}`);
    setIsLoading(false);
  };

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    setLoadAttempt(prev => prev + 1);
  };

  return {
    numPages,
    pageNumber,
    isLoading,
    error,
    pdfDimensions,
    loadAttempt,
    handleDocumentLoadSuccess,
    handlePageLoadSuccess,
    handleLoadError,
    retryLoading
  };
};
