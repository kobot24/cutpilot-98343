
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PDFPreview } from '@/components/PDFPreview';
import { UploadedFile } from '@/types/fileTypes';

type PDFPreviewCardProps = {
  selectedFile: UploadedFile;
  showPreview: boolean;
};

export const PDFPreviewCard = ({ selectedFile, showPreview }: PDFPreviewCardProps) => {
  const shouldShow = selectedFile.convertedPdfUrl || showPreview;
  
  return (
    <Card className={`overflow-hidden ${!shouldShow ? 'hidden lg:block' : ''}`}>
      <CardContent className="p-4 h-full flex flex-col">
        {selectedFile.convertedPdfUrl ? (
          <PDFPreview 
            pdfUrl={selectedFile.convertedPdfUrl} 
            fileName={selectedFile.name.replace(/\.[^/.]+$/, '.pdf')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium">PDF Vorschau</h3>
            <p className="text-sm">PDF wird nach der Konvertierung hier angezeigt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
