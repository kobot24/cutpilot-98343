
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { isTauri } from '@/utils/tauri';
import { saveFileDialog, writeBinaryFile, getDownloadDir } from '@/utils/tauriFileDialog';

type PDFDownloadButtonProps = {
  pdfUrl: string | null | undefined;
  fileName: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean; // Added the missing iconOnly prop
  children?: React.ReactNode;
};

export const PDFDownloadButton = ({
  pdfUrl,
  fileName,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  iconOnly = false, // Add default value
  children
}: PDFDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    if (!pdfUrl) {
      toast({
        title: "Fehler beim Speichern",
        description: "Keine PDF-Datei zum Speichern verfügbar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(10);

      // Generate proper filename
      const downloadName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // Fetch PDF data as ArrayBuffer
      setDownloadProgress(30);
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setDownloadProgress(60);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setDownloadProgress(80);

      // Use Tauri save dialog if in desktop mode
      if (isTauri()) {
        const downloadDir = await getDownloadDir();
        const defaultPath = downloadDir ? `${downloadDir}/${downloadName}` : downloadName;

        const filePath = await saveFileDialog({
          defaultPath,
          filters: [
            {
              name: 'PDF Dateien',
              extensions: ['pdf']
            }
          ]
        });

        if (filePath) {
          const success = await writeBinaryFile(filePath, uint8Array);
          if (success) {
            setDownloadProgress(100);
            toast({
              title: "PDF gespeichert",
              description: `Datei wurde erfolgreich gespeichert`
            });
          } else {
            throw new Error('Fehler beim Speichern der Datei');
          }
        } else {
          // User cancelled
          toast({
            title: "Abgebrochen",
            description: "Speichern abgebrochen"
          });
        }
      } else {
        // Browser fallback - direct download
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);
        setDownloadProgress(100);

        toast({
          title: "Download gestartet",
          description: `${downloadName} wird heruntergeladen`
        });
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: "Fehler beim Speichern",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern",
        variant: "destructive"
      });
    } finally {
      // Reset download state after a delay to show completion
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  };
  
  return (
    <div className="w-full space-y-1">
      <Button
        variant={variant}
        size={size}
        className={`${iconOnly ? 'px-2' : 'w-full'} ${className}`}
        onClick={handleDownload}
        disabled={disabled || !pdfUrl || isDownloading}
      >
        {isDownloading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {!iconOnly && (isTauri() ? "Speichern..." : "Herunterladen...")}
          </span>
        ) : children || (
          <>
            <Download className="h-4 w-4 mr-2" />
            {!iconOnly && (isTauri() ? "Speichern" : "Herunterladen")}
          </>
        )}
      </Button>
      
      {isDownloading && (
        <Progress
          value={downloadProgress}
          className="h-1"
          aria-label="Download progress"
        />
      )}
    </div>
  );
};
