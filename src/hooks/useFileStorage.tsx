import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type UploadedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  convertedPdfUrl?: string;
};

// Constants for storage management
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useFileStorage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load files from localStorage on initial render
  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles');
    if (storedFiles) {
      try {
        const parsedFiles = JSON.parse(storedFiles).map((file: any) => ({
          ...file,
          createdAt: new Date(file.createdAt),
        }));
        setFiles(parsedFiles);
      } catch (error) {
        console.error('Error parsing stored files:', error);
      }
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('uploadedFiles', JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
      
      // Show error to the user
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error(`Speicherlimit erreicht. Bitte löschen Sie einige Dateien.`);
        
        // If we have files in state already, keep only the most recent ones
        if (files.length > 1) {
          // Keep only the 5 most recent files to recover from this state
          const sortedFiles = [...files].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const reducedFiles = sortedFiles.slice(0, Math.max(1, Math.floor(files.length / 2)));
          setFiles(reducedFiles);
        }
      }
    }
  }, [files]);

  const addFiles = async (newFiles: FileList) => {
    setIsLoading(true);
    
    try {
      // Filter by file type and size
      const filesArray = Array.from(newFiles).filter(file => {
        if (!file.type.startsWith('image/')) {
          return false;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`Datei "${file.name}" überschreitet ${MAX_FILE_SIZE_MB}MB Limit`);
          return false;
        }
        return true;
      });

      // Check if we're going to exceed the max file count
      if (files.length + filesArray.length > MAX_FILES) {
        toast.warning(`Maximum von ${MAX_FILES} Dateien erreicht. Löschen Sie einige Dateien, um neue hinzuzufügen.`);
        filesArray.splice(MAX_FILES - files.length); // Keep only what we can add
      }
      
      if (filesArray.length === 0) {
        setIsLoading(false);
        return;
      }

      // Process the files
      const newUploadedFiles: UploadedFile[] = await Promise.all(
        filesArray.map(async (file) => {
          const url = await readFileAsDataURL(file);
          return {
            id: generateId(),
            name: file.name,
            url,
            type: file.type,
            size: file.size,
            createdAt: new Date(),
          };
        })
      );

      setFiles(prev => {
        // If we're approaching the max files limit, show a warning
        if (prev.length + newUploadedFiles.length >= MAX_FILES) {
          toast.warning(`Sie nähern sich dem Limit von ${MAX_FILES} Dateien.`);
        }
        return [...prev, ...newUploadedFiles];
      });
      
      if (newUploadedFiles.length > 0 && !selectedFile) {
        setSelectedFile(newUploadedFiles[0]);
      }
    } catch (error) {
      console.error('Error adding files:', error);
      toast.error('Fehler beim Hinzufügen der Dateien');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    if (selectedFile?.id === id) {
      const remainingFiles = files.filter(file => file.id !== id);
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const selectFile = (id: string) => {
    const file = files.find(file => file.id === id);
    if (file) {
      setSelectedFile(file);
    }
  };

  const createCutContourPath = (width: number, height: number, offset: number): string => {
    // Create a rectanglar path with rounded corners
    const offsetPt = offset * 2.83; // Convert mm to points (72 dpi)
    const x = offsetPt;
    const y = offsetPt;
    const w = width - (offsetPt * 2);
    const h = height - (offsetPt * 2);
    const r = 10; // Corner radius

    return `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
  };

  const convertToPdf = async (fileId: string) => {
    setIsLoading(true);
    try {
      // Find the file to convert
      const file = files.find(f => f.id === fileId);
      if (!file) {
        toast.error('Datei nicht gefunden');
        return;
      }
      
      // Create image element to get dimensions
      const img = document.createElement('img');
      img.src = file.url;
      
      // Wait for image to load
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      // Get settings from localStorage
      const storedSettings = localStorage.getItem('userSettings');
      const settings = storedSettings 
        ? JSON.parse(storedSettings)
        : { cutContourOffset: 3, spotColorName: 'CutContour' };
      
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add image to PDF
      const jpgImage = await pdfDoc.embedJpg(file.url);
      const imgDims = jpgImage.scale(1);

      // Create page slightly larger than the image
      const page = pdfDoc.addPage([
        imgDims.width + 40,
        imgDims.height + 40
      ]);
      
      // Place image centered on the page
      page.drawImage(jpgImage, {
        x: 20,
        y: 20,
        width: imgDims.width,
        height: imgDims.height,
      });
      
      // Add cut contour path
      page.drawSvgPath(createCutContourPath(imgDims.width + 40, imgDims.height + 40, settings.cutContourOffset), {
        borderColor: rgb(1, 0, 0), // Using RGB values for spot color simulation
        borderWidth: 1,
        borderOpacity: 1,
      });
      
      // Add spot color marker
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(settings.spotColorName, {
        x: 5,
        y: 5,
        size: 8,
        font,
        color: rgb(1, 0, 0), // Same color as the cut contour
      });

      // Save PDF as base64
      const pdfBytes = await pdfDoc.save();
      const pdfUrl = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
      
      // Update file with converted PDF URL
      setFiles(files.map(f => 
        f.id === fileId 
          ? { ...f, convertedPdfUrl: pdfUrl }
          : f
      ));
      
      // Update selected file if it's the one we just converted
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, convertedPdfUrl: pdfUrl });
      }

      return pdfUrl;
    } catch (error) {
      console.error('Error converting file to PDF:', error);
      toast.error('Fehler bei der PDF-Konvertierung');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    toast.success('Alle Dateien wurden gelöscht');
  };

  return {
    files,
    selectedFile,
    isLoading,
    addFiles,
    removeFile,
    selectFile,
    convertToPdf,
    clearAllFiles,
    MAX_FILE_SIZE_MB,
    MAX_FILES
  };
};

// Helper functions
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
