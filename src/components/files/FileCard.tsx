
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { UploadedFile } from '@/types/fileTypes';
import { UserSettings } from '@/hooks/useSettings';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { getColorSpaceLabel, getColorSpaceIcon } from '@/utils/pdf/colorSpaceDetector';

type FileCardProps = {
  file: UploadedFile;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onConvertToPdf: (fileId: string) => Promise<string | undefined>;
  settings: UserSettings;
  isProcessing: boolean;
  isGlobalLoading: boolean;
  onCheckboxClick: (e: React.MouseEvent, fileId: string) => void;
  isCheckboxSelected: boolean;
  isBatchProcessing?: boolean;
};

export const FileCard = ({
  file,
  isSelected,
  onSelect,
  onRemove,
  onConvertToPdf,
  settings,
  isProcessing,
  isGlobalLoading,
  onCheckboxClick,
  isCheckboxSelected,
  isBatchProcessing = false,
}: FileCardProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string>('');
  
  const handleSingleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsConverting(true);
    setConversionError('');
    
    try {
      await onConvertToPdf(file.id);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Konvertierungsfehler');
    } finally {
      setIsConverting(false);
    }
  };

  // Disable interactions during batch processing
  const isDisabled = isGlobalLoading || isConverting || isBatchProcessing;

  return (
    <Card
      key={file.id}
      className={`overflow-hidden cursor-pointer border ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      } ${isBatchProcessing ? 'opacity-70' : ''}`}
      onClick={() => !isDisabled && onSelect(file.id)}
    >
      <div className="aspect-square relative bg-gray-100">
        <img
          src={file.url}
          alt={file.name}
          className="object-contain w-full h-full"
        />
        <div className="absolute top-2 right-2 z-10">
          <Checkbox
            checked={isCheckboxSelected}
            onClick={(e) => onCheckboxClick(e, file.id)}
            className="bg-white border-gray-300 data-[state=checked]:bg-blue-500"
            disabled={isBatchProcessing}
          />
        </div>

        {/* Color Space Badge */}
        {file.colorSpace && (
          <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded flex items-center gap-1 ${
            file.colorSpace === 'CMYK' ? 'bg-green-600' :
            file.colorSpace === 'RGB' ? 'bg-blue-600' :
            file.colorSpace === 'Gray' ? 'bg-gray-600' :
            file.colorSpace === 'Mixed' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}>
            <span>{getColorSpaceIcon(file.colorSpace)}</span>
            <span>{getColorSpaceLabel(file.colorSpace)}</span>
          </div>
        )}

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
              onRemove(file.id);
            }}
            disabled={isBatchProcessing}
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
            disabled={!!file.convertedPdfUrl || isDisabled}
            onClick={handleSingleConvert}
          >
            {isConverting ? (
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
        {conversionError && (
          <div className="mt-1 text-xs text-red-600">
            {conversionError}
          </div>
        )}
      </div>
    </Card>
  );
};
