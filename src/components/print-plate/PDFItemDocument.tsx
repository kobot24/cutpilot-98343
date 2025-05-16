
import { Document, Page } from 'react-pdf';

type PDFItemDocumentProps = {
  pdfUrl: string;
  width: number;
  height: number;
  onLoadSuccess: (document: any) => void;
};

export const PDFItemDocument = ({ 
  pdfUrl, 
  width, 
  height, 
  onLoadSuccess 
}: PDFItemDocumentProps) => {
  return (
    <Document
      file={pdfUrl}
      onLoadSuccess={onLoadSuccess}
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
        width={width}
        height={height}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="pdf-page"
        scale={1}
      />
    </Document>
  );
};
