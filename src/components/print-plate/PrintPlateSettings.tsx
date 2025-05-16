
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

export type PrintPlateSize = {
  width: number;  // in cm
  height: number; // in cm
};

// Update default size to match usePrintPlateState
const DEFAULT_SIZE: PrintPlateSize = {
  width: 300,
  height: 200
};

type PrintPlateSettingsProps = {
  plateSize: PrintPlateSize;
  onSizeChange: (size: PrintPlateSize) => void;
};

export const PrintPlateSettings = ({
  plateSize,
  onSizeChange,
}: PrintPlateSettingsProps) => {
  const [width, setWidth] = useState(plateSize.width.toString());
  const [height, setHeight] = useState(plateSize.height.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newWidth = parseFloat(width);
    const newHeight = parseFloat(height);
    
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
      toast.error('Bitte geben Sie gültige Abmessungen ein');
      return;
    }
    
    onSizeChange({ width: newWidth, height: newHeight });
    toast.success('Druckplattengröße aktualisiert');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Druckplattengröße</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="width" className="mb-1.5 block text-sm">Breite (cm)</Label>
            <Input
              id="width"
              type="number"
              min="1"
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="height" className="mb-1.5 block text-sm">Höhe (cm)</Label>
            <Input
              id="height"
              type="number" 
              min="1"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="h-9"
            />
          </div>
          <Button type="submit" className="h-9 px-4">Aktualisieren</Button>
        </form>
      </CardContent>
    </Card>
  );
};
