
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { UserSettings } from '@/hooks/useSettings';

type SettingsPanelProps = {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
};

export const SettingsPanel = ({
  settings,
  onUpdateSettings,
}: SettingsPanelProps) => {
  const [cutContourOffset, setCutContourOffset] = useState(settings.cutContourOffset.toString());
  
  const handleSave = () => {
    const offsetValue = parseFloat(cutContourOffset);
    
    if (isNaN(offsetValue) || offsetValue <= 0) {
      toast.error('Bitte geben Sie einen gültigen Wert für den Abstand ein');
      return;
    }
    
    onUpdateSettings({
      cutContourOffset: offsetValue,
      // Always use "CutContour" as spot color name to ensure compatibility
      spotColorName: "CutContour"
    });
    
    toast.success('Einstellungen gespeichert');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Einstellungen</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CutContour Einstellungen</CardTitle>
          <CardDescription>
            Konfigurieren Sie die Parameter für die CutContour-Erstellung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cutContourOffset">Abstand der CutContour (mm)</Label>
            <Input
              id="cutContourOffset"
              type="number"
              step="0.1"
              min="0.1"
              value={cutContourOffset}
              onChange={(e) => setCutContourOffset(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Abstand zwischen dem Bild und der Schneidkontur
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spotColorName">Name der Spotfarbe</Label>
            <Input
              id="spotColorName"
              type="text"
              value="CutContour"
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">
              Die Spotfarbe wird immer als "CutContour" definiert (Adobe Standard)
            </p>
          </div>

          <Button onClick={handleSave}>Einstellungen speichern</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Über das Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Dieses Tool ermöglicht es, JPG-Dateien hochzuladen, PDFs mit CutContour zu erstellen
            und diese auf Druckplatten anzuordnen. Die CutContour wird als Volltonfarbe mit dem 
            Namen "CutContour" erstellt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
