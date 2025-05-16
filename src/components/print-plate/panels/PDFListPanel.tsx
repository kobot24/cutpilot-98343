
import { UploadedFile } from '@/types/fileTypes';
import { Card } from '@/components/ui/card';
import { PDFList } from '@/components/print-plate/PDFList';

type PDFListPanelProps = {
  files: UploadedFile[];
  onAddPDF: (file: UploadedFile) => void;
};

export const PDFListPanel = ({ files, onAddPDF }: PDFListPanelProps) => {
  // Filter files that have been converted to PDFs
  const pdfFiles = files.filter(file => file.convertedPdfUrl);
  
  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium">Verfügbare PDFs</h3>
        <p className="text-sm text-gray-500">
          {pdfFiles.length} {pdfFiles.length === 1 ? 'PDF' : 'PDFs'} verfügbar
        </p>
      </div>
      
      <PDFList pdfFiles={pdfFiles} onAddPDF={onAddPDF} />
    </Card>
  );
};
