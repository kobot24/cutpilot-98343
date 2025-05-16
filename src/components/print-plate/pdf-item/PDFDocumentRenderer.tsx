
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

type PDFDocumentRendererProps = {
  pdfUrl: string;
  pixelWidth: number;
  pixelHeight: number;
  thumbnail?: string;
  onLoadSuccess: () => void;
  onLoadError: (error: Error) => void;
};

export const PDFDocumentRenderer = ({
  pdfUrl,
  pixelWidth,
  pixelHeight,
  thumbnail,
  onLoadSuccess,
  onLoadError
}: PDFDocumentRendererProps) => {
  if (pdfUrl) {
    return (
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        onError={onLoadError}
        loading={
          <div className="flex items-center justify-center w-full h-full">
            <div className="animate-pulse text-xs text-gray-400">Lädt...</div>
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
  } else if (thumbnail) {
    // Fallback to thumbnail if PDF URL is not available
    return (
      <img 
        src={thumbnail} 
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
};
