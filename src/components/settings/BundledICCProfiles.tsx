/**
 * Bundled ICC Profiles Display
 *
 * Shows ICC profiles bundled with the application (from Ghostscript resources)
 */

import { useEffect } from 'react';
import { useGhostscript } from '../../hooks/useGhostscript';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

export function BundledICCProfiles() {
  const { availableProfiles, refreshProfiles, error } = useGhostscript();

  useEffect(() => {
    refreshProfiles();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundled ICC-Profile
        </CardTitle>
        <CardDescription>
          Im App-Bundle enthaltene ICC-Profile (professionelle Standards)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {availableProfiles.length > 0 ? (
          <div className="space-y-3">
            <Label>Verfügbare Profile ({availableProfiles.length})</Label>
            <div className="space-y-2">
              {availableProfiles.map((profile) => {
                const profileName = profile.replace(/\.(icc|icm)$/, '');
                const isStandard = profile.includes('ISOcoated') || profile.includes('sRGB');

                return (
                  <div
                    key={profile}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="font-medium truncate">{profileName}</p>
                        {isStandard && (
                          <Badge variant="secondary" className="text-xs">
                            Standard
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {profile.includes('ISOcoated') && 'Offset-Druck Europa (Fogra39)'}
                        {profile.includes('PSO') && 'Process Standard Offset (Fogra51)'}
                        {profile.includes('sRGB') && 'Standard RGB (IEC 61966-2-1)'}
                        {profile.includes('AdobeRGB') && 'Adobe RGB (1998) Wide Gamut'}
                        {profile.includes('USWeb') && 'US Web Coated SWOP v2'}
                        {!profile.includes('ISOcoated') &&
                          !profile.includes('PSO') &&
                          !profile.includes('sRGB') &&
                          !profile.includes('AdobeRGB') &&
                          !profile.includes('USWeb') &&
                          'Benutzerdefiniertes ICC-Profil'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Keine bundled ICC-Profile gefunden</p>
            <p className="text-xs mt-1">
              Füge ICC-Profile in src-tauri/resources/icc-profiles/ hinzu
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Hinweis:</p>
          <p className="text-muted-foreground">
            Diese Profile sind fest in der App integriert und können für Ghostscript
            CMYK-Konvertierung verwendet werden.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
