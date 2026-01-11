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
import { openFileDialog, readBinaryFile } from '@/utils/tauriFileDialog';
import { UpdateChecker } from '@/components/UpdateChecker';
import { BundledICCProfiles } from '@/components/settings/BundledICCProfiles';
import { PDFCMYKConverter } from '@/components/pdf/PDFCMYKConverter';

export const Settings = () => {
  const {
    settings,
    isLoading,
    updateSetting,
    addICCProfile,
    removeICCProfile,
    setDefaultICCProfile,
    resetSettings
  } = useSettings();

  const [isUploading, setIsUploading] = useState(false);

  const handleICCUpload = async () => {
    if (isTauri()) {
      // Use Tauri file dialog
      try {
        setIsUploading(true);
        const selected = await openFileDialog({
          multiple: false,
          filters: [
            {
              name: 'ICC Profile',
              extensions: ['icc', 'icm']
            }
          ]
        });

        if (!selected || Array.isArray(selected)) return;

        const contents = await readBinaryFile(selected);
        if (!contents) {
          toast.error('Fehler beim Lesen der Datei');
          return;
        }

        const fileName = selected.split('/').pop() || selected.split('\\').pop() || 'profile.icc';
        const blob = new Blob([contents], { type: 'application/octet-stream' });
        const file = new File([blob], fileName, { type: 'application/octet-stream' });

        await addICCProfile(file);
        toast.success(`ICC-Profil "${fileName}" hinzugefügt`);
      } catch (error) {
        console.error('Error uploading ICC profile:', error);
        toast.error('Fehler beim Hochladen des ICC-Profils');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Browser file input fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.icc,.icm';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            setIsUploading(true);
            await addICCProfile(file);
            toast.success(`ICC-Profil "${file.name}" hinzugefügt`);
          } catch (error) {
            toast.error('Fehler beim Hochladen des ICC-Profils');
          } finally {
            setIsUploading(false);
          }
        }
      };
      input.click();
    }
  };

  const handleRemoveProfile = (profileId: string) => {
    removeICCProfile(profileId);
    toast.success('ICC-Profil entfernt');
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

        {/* ICC Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>ICC-Profile Verwaltung</CardTitle>
            <CardDescription>
              Verwalten Sie ICC-Profile für die Farbkonvertierung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Button */}
            <div>
              <Button
                onClick={handleICCUpload}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Wird hochgeladen...' : 'ICC-Profil hochladen'}
              </Button>
            </div>

            {/* Profile List */}
            {settings.iccProfiles.length > 0 ? (
              <div className="space-y-3">
                <Label>Hochgeladene Profile ({settings.iccProfiles.length})</Label>
                <div className="space-y-2">
                  {settings.iccProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{profile.name}</p>
                          {settings.defaultICCProfile === profile.fileName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                              <Check className="h-3 w-3" />
                              Standard
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {profile.fileName} • {new Date(profile.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.defaultICCProfile !== profile.fileName && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultICCProfile(profile.fileName)}
                          >
                            Als Standard
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProfile(profile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Keine ICC-Profile hochgeladen</p>
                <p className="text-xs mt-1">
                  Laden Sie ICC-Profile hoch für präzise Farbkonvertierung
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bundled ICC Profiles */}
        <BundledICCProfiles />

        {/* PDF CMYK Converter */}
        <PDFCMYKConverter />

        {/* Color Space Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Farbraum-Einstellungen</CardTitle>
            <CardDescription>
              Konfigurieren Sie die Farbkonvertierung für importierte PDFs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Convert Color Space Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="convertColorSpace">PDF Farbraum konvertieren</Label>
                <p className="text-xs text-muted-foreground">
                  Hochgeladene PDFs in anderen Farbraum konvertieren
                </p>
              </div>
              <Switch
                id="convertColorSpace"
                checked={settings.convertColorSpace}
                onCheckedChange={(checked) => updateSetting('convertColorSpace', checked)}
              />
            </div>

            {/* ICC Profile Mode */}
            {settings.convertColorSpace && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="iccProfileMode">ICC-Profil Modus</Label>
                  <Select
                    value={settings.iccProfileMode}
                    onValueChange={(value) =>
                      updateSetting('iccProfileMode', value as any)
                    }
                  >
                    <SelectTrigger id="iccProfileMode" className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preserve">Original ICC-Profil beibehalten</SelectItem>
                      <SelectItem value="convert">Zu neuem ICC-Profil konvertieren</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {settings.iccProfileMode === 'preserve'
                      ? 'Verwendet das ICC-Profil vom hochgeladenen PDF'
                      : 'Verwendet das ausgewählte ICC-Profil aus den Einstellungen'
                    }
                  </p>
                </div>

                {/* Target Color Space - only show when converting */}
                {settings.iccProfileMode === 'convert' && (
                  <div className="space-y-2">
                    <Label htmlFor="targetColorSpace">Ziel-Farbraum</Label>
                    <Select
                      value={settings.targetColorSpace}
                      onValueChange={(value) =>
                        updateSetting('targetColorSpace', value as any)
                      }
                    >
                      <SelectTrigger id="targetColorSpace" className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DeviceCMYK">CMYK (DeviceCMYK)</SelectItem>
                        <SelectItem value="DeviceRGB">RGB (DeviceRGB)</SelectItem>
                        <SelectItem value="DeviceGray">Graustufen (DeviceGray)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Farbraum für konvertierte PDFs
                    </p>
                  </div>
                )}
              </>
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
