import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import { Upload, X, Check, Settings as SettingsIcon } from 'lucide-react';
import { isTauri } from '@/utils/tauri';
import { UpdateChecker } from '@/components/UpdateChecker';

export const Settings = () => {
  const {
    settings,
    isLoading,
    updateSetting,
    selectICCProfile,
    removeICCProfile,
    getCurrentICCProfileName,
    resetSettings
  } = useSettings();

  const [isSelecting, setIsSelecting] = useState(false);

  /**
   * VEREINFACHT: Nur Pfad auswählen, keine Uploads!
   */
  const handleICCProfileSelect = async () => {
    try {
      setIsSelecting(true);
      await selectICCProfile();
      const fileName = getCurrentICCProfileName();
      if (fileName) {
        toast.success(`ICC-Profil ausgewählt: ${fileName}`);
      }
    } catch (error) {
      console.error('Error selecting ICC profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler bei der Auswahl';
      toast.error(errorMessage);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRemoveProfile = () => {
    try {
      removeICCProfile();
      toast.success('ICC-Profil entfernt');
    } catch (error) {
      console.error('Error removing profile:', error);
      toast.error('Fehler beim Entfernen des Profils');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      resetSettings();
      toast.success('Einstellungen zurückgesetzt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <SettingsIcon className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Einstellungen
        </h1>
        <p className="text-muted-foreground mt-2">
          Konfigurieren Sie CutPilot nach Ihren Anforderungen
        </p>
      </div>

      <div className="space-y-6">
        {/* Cut Contour Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cut-Kontur Einstellungen</CardTitle>
            <CardDescription>
              Passen Sie die Cut-Kontur-Generierung an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Offset Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cutContourOffset">
                  Abstand der Cut-Kontur (mm)
                </Label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {settings.cutContourOffset} mm
                </span>
              </div>
              <Slider
                id="cutContourOffset"
                min={3}
                max={10}
                step={0.5}
                value={[settings.cutContourOffset]}
                onValueChange={([value]) => updateSetting('cutContourOffset', value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Abstand zwischen Objekt und Cut-Linie (3-10 mm)
              </p>
            </div>

            {/* Cut Contour Name */}
            <div className="space-y-2">
              <Label htmlFor="spotColorName">Name der Cut-Kontur</Label>
              <Input
                id="spotColorName"
                value={settings.spotColorName}
                onChange={(e) => updateSetting('spotColorName', e.target.value)}
                placeholder="CUT"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Spot-Color Name für die Schnittlinie (Standard: CUT)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ICC Profile Settings - VEREINFACHT! */}
        <Card>
          <CardHeader>
            <CardTitle>ICC-Profil (Optional)</CardTitle>
            <CardDescription>
              Wählen Sie ein ICC-Profil für Ghostscript CMYK-Konvertierung.
              Nur benötigt wenn Sie externe Ghostscript-Konvertierung nutzen möchten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Profile Display */}
            {settings.iccProfilePath ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="font-medium truncate">{getCurrentICCProfileName()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {settings.iccProfilePath}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveProfile}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg">
                <p>Kein ICC-Profil ausgewählt</p>
                <p className="text-xs mt-1">
                  Optional: Wählen Sie ein Profil für CMYK-Konvertierung
                </p>
              </div>
            )}

            {/* Select Button */}
            <Button
              onClick={handleICCProfileSelect}
              disabled={isSelecting || !isTauri()}
              className="w-full sm:w-auto"
              variant={settings.iccProfilePath ? 'outline' : 'default'}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSelecting
                ? 'Wird ausgewählt...'
                : settings.iccProfilePath
                  ? 'Anderes Profil wählen'
                  : 'ICC-Profil auswählen'}
            </Button>

            {!isTauri() && (
              <p className="text-xs text-yellow-600 mt-2">
                ICC-Profil-Auswahl nur in der Desktop-App verfügbar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Update Section - Disabled until updater is properly configured
            To enable: Set updater.active = true in tauri.conf.json and configure signing
        {isTauri() && (
          <Card>
            <CardHeader>
              <CardTitle>Software-Updates</CardTitle>
              <CardDescription>
                Prüfen Sie auf neue Versionen von CutPilot und installieren Sie Updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateChecker />
            </CardContent>
          </Card>
        )}
        */}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aktionen</CardTitle>
            <CardDescription>
              Einstellungen zurücksetzen oder exportieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleResetSettings}
            >
              Alle Einstellungen zurücksetzen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
