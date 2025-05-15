
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type PDFDownloadButtonProps = {
  pdfUrl: string | null | undefined;
  fileName: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

export const PDFDownloadButton = ({
  pdfUrl,
  fileName,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  children
}: PDFDownloadButtonProps) => {
  const handleDownload = async () => {
    if (!pdfUrl) {
      toast({
        title: "Fehler beim Herunterladen",
        description: "Keine PDF-Datei zum Herunterladen verfügbar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate proper filename
      const downloadName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      
      // Handle different URL types
      if (pdfUrl.startsWith('blob:')) {
        // Blob URLs can be directly downloaded
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      else if (pdfUrl.startsWith('data:application/pdf')) {
        // Check if data URL is very large
        if (pdfUrl.length > 10000000) { // ~10MB
          // For large data URLs, convert to blob first
          const response = await fetch(pdfUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL after a short delay
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
          // For smaller data URLs, download directly
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // For remote URLs
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      toast({
        title: "Download gestartet",
        description: `${downloadName} wird heruntergeladen`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Fehler beim Herunterladen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Herunterladen",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={disabled || !pdfUrl}
    >
      {children || (
        <>
          <Download className="h-4 w-4 mr-2" />
          Herunterladen
        </>
      )}
    </Button>
  );
};
