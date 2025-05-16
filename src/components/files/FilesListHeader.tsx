
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

type FilesListHeaderProps = {
  filesCount: number;
  selectedFilesCount: number;
  onSelectAll: () => void;
  onBatchConvert: () => void;
  isAllSelected: boolean;
  isLoading: boolean;
};

export const FilesListHeader = ({
  filesCount,
  selectedFilesCount,
  onSelectAll,
  onBatchConvert,
  isAllSelected,
  isLoading,
}: FilesListHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-2">
      {/* Display file selection count if files are selected */}
      {selectedFilesCount > 0 ? (
        <span className="text-sm">{selectedFilesCount} Dateien ausgewählt</span>
      ) : (
        <span className="text-sm">{filesCount} Dateien</span>
      )}
      
      <div className="flex gap-2">
        {/* Select All button */}
        <Button 
          onClick={onSelectAll} 
          variant="outline" 
          size="sm" 
          className="text-xs"
          disabled={isLoading}
        >
          {isAllSelected ? "Alle abwählen" : "Alle auswählen"}
        </Button>
        
        {/* Show batch convert button only when files are selected */}
        {selectedFilesCount > 0 && (
          <Button 
            onClick={onBatchConvert} 
            className="text-sm" 
            size="sm" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Konvertiere...
              </span>
            ) : (
              "Ausgewählte zu PDF konvertieren"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
