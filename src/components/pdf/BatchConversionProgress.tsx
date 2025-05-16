
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';
import { BatchConversionProgress as BatchProgressType } from '@/hooks/usePDFConverter';

type BatchConversionProgressProps = {
  progress: BatchProgressType;
};

export const BatchConversionProgress = ({ progress }: BatchConversionProgressProps) => {
  if (!progress.isActive) return null;
  
  return (
    <div className="mb-4 p-3 border rounded-md bg-background shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Loader className="h-4 w-4 animate-spin text-primary" />
          <span className="font-medium text-sm">
            Batch-Konvertierung
          </span>
        </div>
        <span className="text-xs font-medium">
          {progress.currentFileIndex} / {progress.totalFiles} Dateien
        </span>
      </div>
      
      <Progress 
        value={progress.overallProgress} 
        className="h-2 mb-2" 
      />
      
      <div className="text-xs text-muted-foreground">
        Aktuell: {progress.currentFileName}
      </div>
    </div>
  );
};
