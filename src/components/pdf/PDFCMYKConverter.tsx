/**
 * PDF CMYK Converter Component
 *
 * Converts existing PDFs to CMYK using embedded Ghostscript
 * with ICC profile support and spot color preservation.
 */

import { useState } from 'react';
import { useGhostscript } from '../../hooks/useGhostscript';
import { RenderIntent } from '../../utils/ghostscript/ghostscriptApi';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { openFileDialog, saveFileDialog } from '../../utils/tauriFileDialog';

export function PDFCMYKConverter() {
  const { availableProfiles, convert, isLoading, error, conversionResult, clearError } = useGhostscript();
  const { settings } = useSettings();

  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [preserveSpotColors, setPreserveSpotColors] = useState(true);
  const [renderIntent, setRenderIntent] = useState<RenderIntent>(RenderIntent.RelativeColorimetric);

  const handleSelectPDF = async () => {
    try {
      const selected = await openFileDialog({
        title: 'PDF zum Konvertieren auswählen',
        filters: [
          { name: 'PDF', extensions: ['pdf'] }
        ],
        multiple: false
      });

      if (selected) {
        setSelectedPDF(selected);
        clearError();
      }
    } catch (err) {
      console.error('Error selecting PDF:', err);
    }
  };

  const handleConvert = async () => {
    if (!selectedPDF) return;

    try {
      // Ask for output location
      const outputPath = await saveFileDialog({
        title: 'CMYK PDF speichern',
        defaultPath: selectedPDF.replace('.pdf', '-CMYK.pdf'),
        filters: [
          { name: 'PDF', extensions: ['pdf'] }
        ]
      });

      if (!outputPath) return;

      // Perform conversion
      const result = await convert({
        inputPath: selectedPDF,
        outputPath,
        iccProfileName: selectedProfile || undefined,
        preserveSpotColors,
        renderIntent
      });

      if (result.success) {
        console.log('✅ PDF successfully converted to CMYK');
      }
    } catch (err) {
      console.error('Conversion error:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>PDF zu CMYK konvertieren</CardTitle>
        <CardDescription>
          Konvertiere existierende PDFs professionell zu CMYK mit Ghostscript
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PDF Selection */}
        <div className="space-y-2">
          <Label>PDF auswählen</Label>
          <div className="flex gap-2">
            <Button
              onClick={handleSelectPDF}
              variant="outline"
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              {selectedPDF ? 'PDF ändern' : 'PDF auswählen'}
            </Button>
          </div>
          {selectedPDF && (
            <p className="text-sm text-muted-foreground truncate">
              {selectedPDF.split('/').pop()}
            </p>
          )}
        </div>

        {/* ICC Profile Selection */}
        <div className="space-y-2">
          <Label htmlFor="icc-profile">ICC-Profil (Optional)</Label>
          <Select
            value={selectedProfile || 'none'}
            onValueChange={(value) => setSelectedProfile(value === 'none' ? null : value)}
          >
            <SelectTrigger id="icc-profile">
              <SelectValue placeholder="Kein Profil (Standard CMYK)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Kein Profil (Standard CMYK)</SelectItem>
              {availableProfiles.map((profile) => (
                <SelectItem key={profile} value={profile}>
                  {profile.replace('.icc', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableProfiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Keine bundled ICC-Profile gefunden. Füge Profile in resources/icc-profiles/ hinzu.
            </p>
          )}
        </div>

        {/* Rendering Intent */}
        <div className="space-y-2">
          <Label htmlFor="render-intent">Rendering Intent</Label>
          <Select
            value={renderIntent.toString()}
            onValueChange={(value) => setRenderIntent(parseInt(value) as RenderIntent)}
          >
            <SelectTrigger id="render-intent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Perceptual (Fotos)</SelectItem>
              <SelectItem value="1">Relative Colorimetric (Standard Druck)</SelectItem>
              <SelectItem value="2">Saturation (Grafiken)</SelectItem>
              <SelectItem value="3">Absolute Colorimetric (Proofing)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Spot Color Preservation */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="preserve-spots">Spot Colors erhalten</Label>
            <p className="text-sm text-muted-foreground">
              CutContour und andere Spot Colors bleiben unverändert
            </p>
          </div>
          <Switch
            id="preserve-spots"
            checked={preserveSpotColors}
            onCheckedChange={setPreserveSpotColors}
          />
        </div>

        {/* Convert Button */}
        <Button
          onClick={handleConvert}
          disabled={!selectedPDF || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Konvertiere zu CMYK...
            </>
          ) : (
            'Zu CMYK konvertieren'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {conversionResult?.success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              PDF erfolgreich zu CMYK konvertiert!
              <br />
              <span className="text-sm text-muted-foreground">
                Gespeichert: {conversionResult.outputPath.split('/').pop()}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Hinweise:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>RGB-Bilder werden zu CMYK konvertiert</li>
            <li>Spot Colors bleiben erhalten (wenn aktiviert)</li>
            <li>Professionelle Prepress-Qualität (/prepress)</li>
            <li>PDF/X-3 kompatibel</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
