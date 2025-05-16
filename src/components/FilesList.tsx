
import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type FilesListProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onBatchConvert?: (fileIds: string[]) => void;
};

export const FilesList = ({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
  onBatchConvert
}: FilesListProps) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const handleCheckboxClick = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };
  
  const handleBatchConvert = () => {
    if (onBatchConvert && selectedFiles.length > 0) {
      onBatchConvert(selectedFiles);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
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
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        <h3 className="text-lg font-medium">Keine Dateien</h3>
        <p className="text-sm">Laden Sie Dateien hoch, um hier anzuzeigen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">{selectedFiles.length} Dateien ausgewählt</span>
          <Button onClick={handleBatchConvert} className="text-sm">
            Ausgewählte zu PDF konvertieren
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
        {files.map((file) => (
          <Card
            key={file.id}
            className={`overflow-hidden cursor-pointer border ${
              selectedFileId === file.id
                ? 'border-blue-500 ring-1 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectFile(file.id)}
          >
            <div className="aspect-square relative bg-gray-100">
              <img
                src={file.url}
                alt={file.name}
                className="object-contain w-full h-full"
              />
              <div className="absolute top-2 right-2 z-10">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onClick={(e) => handleCheckboxClick(e, file.id)}
                  className="bg-white border-gray-300 data-[state=checked]:bg-blue-500"
                />
              </div>
              {file.convertedPdfUrl && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  PDF
                </div>
              )}
            </div>
            <div className="p-2 flex flex-col">
              <div className="flex justify-between items-start">
                <div className="truncate max-w-[80%]">
                  <p className="font-medium truncate text-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
