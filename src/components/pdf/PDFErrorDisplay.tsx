
import React from 'react';
import { Button } from '@/components/ui/button';

type PDFErrorDisplayProps = {
  error: string;
  retryLoading: () => void;
};

export const PDFErrorDisplay = ({ error, retryLoading }: PDFErrorDisplayProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-red-500 p-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-center mb-2">{error}</p>
      <p className="text-sm text-gray-600 text-center">
        Tipp: Überprüfen Sie die Größe des Bildes. Sehr große Bilder können Probleme verursachen.
      </p>
      <Button 
        variant="outline" 
        size="sm"
        className="mt-4"
        onClick={retryLoading}
      >
        Neu laden versuchen
      </Button>
    </div>
  );
};
