
import { UploadedFile } from '@/hooks/useFileStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type FilesListProps = {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
};

export const FilesList = ({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
}: FilesListProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
      {files.map((file) => (
        <Card
          key={file.id}
          className={`overflow-hidden cursor-pointer border ${
            selectedFileId === file.id
              ? 'border-blue-500 ring-2 ring-blue-200'
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
            {file.convertedPdfUrl && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                PDF
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="truncate max-w-[80%]">
                <p className="font-medium truncate text-sm">{file.name}</p>
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
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(file.id);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
  );
};
