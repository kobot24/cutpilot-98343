
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, EyeOff, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PDFControlsProps = {
  showCutContour: boolean;
  toggleCutContour: () => void;
  handleDownload: () => void;
  downloadDisabled?: boolean;
};

export const PDFControls = ({ 
  showCutContour, 
  toggleCutContour, 
  handleDownload,
  downloadDisabled = false
}: PDFControlsProps) => {
  return (
    <div className="flex space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleCutContour} 
              aria-label={showCutContour ? "Schneidekontur ausblenden" : "Schneidekontur anzeigen"}
            >
              {showCutContour ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showCutContour ? "Schneidekontur ausblenden" : "Schneidekontur anzeigen"}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              onClick={handleDownload} 
              disabled={downloadDisabled}
              aria-label="PDF herunterladen"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>PDF herunterladen</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
