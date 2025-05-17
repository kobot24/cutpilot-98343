
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
  // Track if we have a cached thumbnail version
  const [cachedThumbnail, setCachedThumbnail] = useState<string | null>(null);
  
  // Only load the PDF when not dragging
  useEffect(() => {
    if (!isDragging && pdfUrl && !cachedThumbnail) {
      // Create a thumbnail from the PDF for future use
      const img = new Image();
      img.onload = () => {
        try {
          // Create a canvas to generate thumbnail
          const canvas = document.createElement('canvas');
          canvas.width = 300; // Fixed thumbnail width
          canvas.height = (300 / img.width) * img.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setCachedThumbnail(dataUrl);
          }
        } catch (e) {
          console.error("Failed to create thumbnail:", e);
        }
      };
      img.src = thumbnail || pdfUrl;
    }
  }, [pdfUrl, isDragging, thumbnail, cachedThumbnail]);

  // During dragging, show only thumbnail or placeholder
  if (isDragging) {
    if (cachedThumbnail || thumbnail) {
      return (
        <img 
          src={cachedThumbnail || thumbnail || ''} 
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

  // When not dragging, show full PDF
  if (pdfUrl) {
    return (
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        onError={onLoadError}
        loading={
          <div className="flex items-center justify-center w-full h-full">
            {cachedThumbnail || thumbnail ? (
              <img 
                src={cachedThumbnail || thumbnail || ''} 
                alt="Loading PDF" 
                className="w-full h-full object-contain opacity-70"
              />
            ) : (
              <div className="animate-pulse text-xs text-gray-400">Lädt...</div>
            )}
          </div>
        }
        error={
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-xs text-red-400">Fehler</div>
          </div>
        }
        className="w-full h-full"
      >
        <Page
          pageNumber={1}
          width={pixelWidth}
          height={pixelHeight}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="pdf-page"
        />
      </Document>
    );
  } else if (thumbnail || cachedThumbnail) {
    // Fallback to thumbnail if PDF URL is not available
    return (
      <img 
        src={cachedThumbnail || thumbnail || ''} 
        alt="PDF preview" 
        className="w-full h-full object-contain"
      />
    );
  } else {
    // No preview available
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="text-xs text-gray-400">Keine Vorschau</div>
      </div>
    );
  }
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return prevProps.pdfUrl === nextProps.pdfUrl &&
         prevProps.pixelWidth === nextProps.pixelWidth &&
         prevProps.pixelHeight === nextProps.pixelHeight &&
         prevProps.isDragging === nextProps.isDragging &&
         prevProps.thumbnail === nextProps.thumbnail;
});

export default OptimizedPDFDocumentRenderer;
