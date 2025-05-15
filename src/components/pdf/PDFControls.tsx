
import React from 'react';
import { Button } from '@/components/ui/button';

type PDFControlsProps = {
  showCutContour: boolean;
  toggleCutContour: () => void;
  handleDownload: () => void;
};

export const PDFControls = ({ showCutContour, toggleCutContour, handleDownload }: PDFControlsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={toggleCutContour}
      >
        {showCutContour ? 'CutContour ausblenden' : 'CutContour einblenden'}
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDownload}
      >
        Herunterladen
      </Button>
    </div>
  );
};
