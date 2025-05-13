
import { Button } from '@/components/ui/button';

type PDFPreviewProps = {
  pdfUrl: string;
  fileName: string;
};

export const PDFPreview = ({ pdfUrl, fileName }: PDFPreviewProps) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">PDF Vorschau</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
        >
          Herunterladen
        </Button>
      </div>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative">
        <img 
          src={pdfUrl} 
          alt="PDF-Vorschau"
          className="w-full h-full object-contain" 
        />
        <div className="absolute inset-0 pointer-events-none border-4 border-red-500 border-dashed m-8 opacity-50" />
        <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-red-500 font-medium">
          CutContour-Pfad (Vorschau)
        </div>
      </div>
    </div>
  );
};
