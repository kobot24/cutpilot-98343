
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ConversionProgress } from '@/hooks/usePDFConverter';

type PDFConversionProgressProps = {
  progress: ConversionProgress;
  show: boolean;
};

export const PDFConversionProgress = ({ progress, show }: PDFConversionProgressProps) => {
  if (!show) return null;
  
  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{progress.status || 'Verarbeitung...'}</span>
        <span>{progress.progress}%</span>
      </div>
      <Progress 
        value={progress.progress} 
        className="h-1" 
        aria-label="Conversion progress"
      />
    </div>
  );
};

