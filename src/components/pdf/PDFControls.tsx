
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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
        variant="outline" 
        size="sm"
        onClick={handleDownload}
      >
        Herunterladen
      </Button>
    </div>
  );
};
