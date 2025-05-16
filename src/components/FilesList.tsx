import { useState } from 'react';
import { UploadedFile } from '@/types/fileTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { UserSettings } from '@/hooks/useSettings';
import { ConversionProgress } from '@/hooks/usePDFConverter';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';

type FilesListProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  onBatchConvert?: (fileIds: string[]) => void;
  settings: UserSettings;
  isLoading: boolean;
  conversionProgress: ConversionProgress;
};

export const FilesList = ({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
  onConvertToPdf,
  onBatchConvert,
  settings,
  isLoading,
  conversionProgress
}: FilesListProps) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Record<string, boolean>>({});
  const [conversionErrors, setConversionErrors] = useState<Record<string, string>>({});
  
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

  const handleSingleConvert = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    
    setProcessingFiles(prev => ({ ...prev, [fileId]: true }));
    setConversionErrors(prev => ({ ...prev, [fileId]: '' }));
    
    try {
      await onConvertToPdf(fileId);
    } catch (error) {
      setConversionErrors(prev => ({ 
        ...prev, 
        [fileId]: error instanceof Error ? error.message : 'Konvertierungsfehler' 
      }));
    } finally {
      setProcessingFiles(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // New function to handle selecting/deselecting all files
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      // If all files are selected, deselect all
      setSelectedFiles([]);
    } else {
      // Otherwise, select all files
      setSelectedFiles(files.map(file => file.id));
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
      <div className="flex justify-between items-center mb-2">
        {/* Display file selection count if files are selected */}
        {selectedFiles.length > 0 ? (
          <span className="text-sm">{selectedFiles.length} Dateien ausgewählt</span>
        ) : (
          <span className="text-sm">{files.length} Dateien</span>
        )}
        
        <div className="flex gap-2">
          {/* New Select All button */}
          <Button 
            onClick={handleSelectAll} 
            variant="outline" 
            size="sm" 
            className="text-xs"
          >
            {selectedFiles.length === files.length ? "Alle abwählen" : "Alle auswählen"}
          </Button>
          
          {/* Show batch convert button only when files are selected */}
          {selectedFiles.length > 0 && (
            <Button 
              onClick={handleBatchConvert} 
              className="text-sm" 
              size="sm" 
              disabled={isLoading}
            >
              Ausgewählte zu PDF konvertieren
            </Button>
          )}
        </div>
      </div>
      
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
                  
                  {/* Display settings information in each file card */}
                  <div className="mt-1 flex flex-col gap-0.5">
                    <div className="flex items-center text-xs">
                      <span className="font-medium text-[10px]">CutContour-Abstand:</span>
                      <span className="ml-1 text-gray-600 text-[10px]">{settings.cutContourOffset} mm</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="font-medium text-[10px]">Spotfarbe:</span>
                      <span className="ml-1 text-gray-600 text-[10px]">{settings.spotColorName}</span>
                    </div>
                  </div>
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
              
              {/* PDF conversion and download buttons */}
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm"
                  variant="default"
                  className="text-xs flex-1 h-7 py-0 px-2"
                  disabled={!!file.convertedPdfUrl || isLoading || processingFiles[file.id]}
                  onClick={(e) => handleSingleConvert(e, file.id)}
                >
                  {processingFiles[file.id] ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ...
                    </span>
                  ) : file.convertedPdfUrl ? 'PDF erstellt' : 'PDF erstellen'}
                </Button>
                
                {file.convertedPdfUrl && (
                  <PDFDownloadButton
                    pdfUrl={file.convertedPdfUrl}
                    fileName={file.name.replace(/\.[^/.]+$/, '.pdf')}
                    variant="outline"
                    className="h-7 py-0 px-2"
                    iconOnly
                  />
                )}
              </div>
              
              {/* Show error message if PDF conversion failed */}
              {conversionErrors[file.id] && (
                <div className="mt-1 text-xs text-red-600">
                  {conversionErrors[file.id]}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
