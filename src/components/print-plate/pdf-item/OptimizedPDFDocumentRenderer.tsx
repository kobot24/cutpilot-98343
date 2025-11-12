
import { useState, useEffect, memo } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

type OptimizedPDFDocumentRendererProps = {
  pdfUrl: string;
  pixelWidth: number;
  pixelHeight: number;
  thumbnail?: string;
  isDragging: boolean;
  onLoadSuccess: () => void;
  onLoadError: (error: Error) => void;
};

// Use memo to prevent unnecessary re-renders
const OptimizedPDFDocumentRenderer = memo(({
  pdfUrl,
  pixelWidth,
  pixelHeight,
  thumbnail,
  isDragging,
  onLoadSuccess,
  onLoadError
}: OptimizedPDFDocumentRendererProps) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Reset loaded state when pdfUrl changes
  useEffect(() => {
    setPdfLoaded(false);
    setPdfError(false);
  }, [pdfUrl]);

  const handleLoadSuccess = () => {
    setPdfLoaded(true);
    setPdfError(false);
    onLoadSuccess();
  };

  const handleLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError(true);
    setPdfLoaded(false);
    onLoadError(error);
  };

  // During dragging, always show thumbnail for performance
  if (isDragging) {
    if (thumbnail) {
      return (
        <img
          src={thumbnail}
          alt="PDF preview"
          className="w-full h-full object-contain"
          style={{ opacity: 0.8 }}
        />
      );
    } else {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="text-xs text-gray-400">Wird verschoben...</div>
        </div>
      );
    }
  }

  // When not dragging, ALWAYS show the PDF (this was the bug!)
  // The PDF should be visible all the time, not just when dragging
  return (
    <div className="relative w-full h-full">
      {/* Show thumbnail while PDF is loading or if PDF failed */}
      {(!pdfLoaded || pdfError) && thumbnail && (
        <img
          src={thumbnail}
          alt="PDF preview"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: pdfLoaded ? 0 : 1 }}
        />
      )}

      {/* Always render the PDF Document, even when thumbnail is shown */}
      {pdfUrl && !pdfError && (
        <Document
          file={pdfUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null} // Don't show default loading, we use thumbnail instead
          error={null} // Don't show default error, we use thumbnail instead
          className="w-full h-full"
        >
          <Page
            pageNumber={1}
            width={pixelWidth}
            height={pixelHeight}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="pdf-page"
            loading={null}
            error={null}
          />
        </Document>
      )}

      {/* Fallback if no thumbnail and PDF failed */}
      {pdfError && !thumbnail && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="text-xs text-red-400">PDF Fehler</div>
        </div>
      )}

      {/* Fallback if no PDF and no thumbnail */}
      {!pdfUrl && !thumbnail && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="text-xs text-gray-400">Keine Vorschau</div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return prevProps.pdfUrl === nextProps.pdfUrl &&
         Math.abs(prevProps.pixelWidth - nextProps.pixelWidth) < 1 &&
         Math.abs(prevProps.pixelHeight - nextProps.pixelHeight) < 1 &&
         prevProps.isDragging === nextProps.isDragging &&
         prevProps.thumbnail === nextProps.thumbnail;
});

export default OptimizedPDFDocumentRenderer;
