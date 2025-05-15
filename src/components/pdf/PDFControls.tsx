
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Download } from 'lucide-react';

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
        className={showCutContour ? "text-[#D946EF] border-[#D946EF]" : ""}
      >
        {showCutContour ? (
          <>
            <EyeOff className="h-4 w-4 mr-1" />
            CutContour ausblenden
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-1" />
            CutContour einblenden
          </>
        )}
      </Button>
      <Button 
        variant="default" 
        size="sm"
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        <Download className="h-4 w-4 mr-1" />
        Herunterladen
      </Button>
    </div>
  );
};
