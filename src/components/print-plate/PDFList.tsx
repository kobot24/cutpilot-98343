
import { UploadedFile } from '@/types/fileTypes';
import { Button } from '@/components/ui/button';

type PDFListProps = {
  pdfFiles: UploadedFile[];
  onAddPDF: (file: UploadedFile) => void;
};

export const PDFList = ({ pdfFiles, onAddPDF }: PDFListProps) => {
  return (
    <div className="p-4">
      {pdfFiles.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p>Keine PDFs verfügbar</p>
          <p className="text-sm">
            Erstellen Sie zuerst PDFs aus Ihren Bildern
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pdfFiles.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50"
            >
              <div className="w-12 h-16 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                {file.convertedPdfUrl ? (
                  <img 
                    src={file.convertedPdfUrl} 
                    alt={file.name} 
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-red-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.name.replace(/\.[^/.]+$/, '.pdf')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-1"
                onClick={() => onAddPDF(file)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
