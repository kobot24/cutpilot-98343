
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { UploadedFile } from '@/hooks/useFileStorage';

type PDFItem = {
  id: string;
  pdfUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type PrintPlateCanvasProps = {
  files: UploadedFile[];
};

export const PrintPlateCanvas = ({ files }: PrintPlateCanvasProps) => {
  const [items, setItems] = useState<PDFItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Filter files that have been converted to PDFs
  const pdfFiles = files.filter(file => file.convertedPdfUrl);
  
  const handleDragStart = (index: number, e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const item = items[index];
      
      setDraggedItem(index);
      setDragOffset({
        x: e.clientX - (rect.left + item.x),
        y: e.clientY - (rect.top + item.y)
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedItem !== null && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      // Make sure item stays within canvas bounds
      const item = items[draggedItem];
      const boundedX = Math.max(0, Math.min(newX, rect.width - item.width));
      const boundedY = Math.max(0, Math.min(newY, rect.height - item.height));
      
      setItems(items.map((item, index) => 
        index === draggedItem 
          ? { ...item, x: boundedX, y: boundedY } 
          : item
      ));
    }
    
    if (isRotating !== null) {
      // Implement rotation logic if needed
    }
  };
  
  const handleMouseUp = () => {
    setDraggedItem(null);
    setIsRotating(null);
  };
  
  const handleAddPDF = (file: UploadedFile) => {
    if (!file.convertedPdfUrl) return;
    
    // Create a new PDF item
    const newItem: PDFItem = {
      id: file.id,
      pdfUrl: file.convertedPdfUrl,
      x: 20,
      y: 20,
      width: 100,
      height: 150,
      rotation: 0,
    };
    
    setItems([...items, newItem]);
    toast.success(`${file.name} zur Druckplatte hinzugefügt`);
  };
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleRotateItem = (index: number) => {
    setItems(items.map((item, i) => 
      i === index 
        ? { ...item, rotation: (item.rotation + 90) % 360 } 
        : item
    ));
  };
  
  const handleExportPlate = () => {
    // In a real app, this would create a PDF
    toast.success("Druckplatte als PDF exportiert");
  };
  
  const handleClearPlate = () => {
    setItems([]);
    toast.info("Druckplatte geleert");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Printplate-Erstellung</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleClearPlate}
            disabled={items.length === 0}
          >
            Leeren
          </Button>
          <Button
            onClick={handleExportPlate}
            disabled={items.length === 0}
          >
            Als PDF exportieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-3 h-full">
            <div 
              ref={canvasRef}
              className="w-full h-[60vh] bg-white print-plate relative border border-gray-200 rounded"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {items.map((item, index) => (
                <div
                  key={index}
                  className="pdf-item absolute bg-white shadow-md border border-gray-200 flex flex-col"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                    transform: `rotate(${item.rotation}deg)`,
                    zIndex: draggedItem === index ? 10 : 1,
                  }}
                  onMouseDown={(e) => handleDragStart(index, e)}
                >
                  <div className="relative flex-1">
                    <img 
                      src={item.pdfUrl} 
                      alt={`PDF ${index}`} 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 flex space-x-1">
                      <button 
                        className="bg-white rounded p-1 shadow-sm border border-gray-200"
                        onClick={() => handleRotateItem(index)}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3 w-3 text-gray-600" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          />
                        </svg>
                      </button>
                      <button 
                        className="bg-white rounded p-1 shadow-sm border border-gray-200"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3 w-3 text-gray-600" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-12 w-12 mx-auto mb-3" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
                      />
                    </svg>
                    <p className="text-lg font-medium">Druckplatte ist leer</p>
                    <p className="text-sm">
                      Fügen Sie PDFs aus der Liste hinzu
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-gray-500">
                60 × 40 cm
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h3 className="font-medium">Verfügbare PDFs</h3>
              <p className="text-sm text-gray-500">
                {pdfFiles.length} {pdfFiles.length === 1 ? 'PDF' : 'PDFs'} verfügbar
              </p>
            </div>
            
            <div className="p-4">
              {pdfFiles.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p>Keine PDFs verfügbar</p>
                  <p className="text-sm">
                    Erstellen Sie zuerst PDFs aus Ihren Bildern
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pdfFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 text-red-600" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name.replace(/\.[^/.]+$/, '.pdf')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-1"
                        onClick={() => handleAddPDF(file)}
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
                            d="M12 4v16m8-8H4" 
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
