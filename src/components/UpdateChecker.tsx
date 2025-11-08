import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { checkForUpdate, installUpdate, getCurrentVersion, UpdateStatus } from '@/utils/tauriUpdater';
import { toast } from 'sonner';
import { isTauri } from '@/utils/tauri';

export const UpdateChecker = () => {
  const [status, setStatus] = useState<UpdateStatus>({ type: 'IDLE' });
  const [currentVersion, setCurrentVersion] = useState<string>('');

  // Load current version on mount
  useState(() => {
    getCurrentVersion().then(setCurrentVersion);
  });

  const handleCheckForUpdates = async () => {
    setStatus({ type: 'CHECKING' });

    try {
      const result = await checkForUpdate();
      setStatus(result);

      if (result.type === 'UP_TO_DATE') {
        toast.success('Sie verwenden die neueste Version');
      } else if (result.type === 'UPDATE_AVAILABLE') {
        toast.success(`Update verfügbar: Version ${result.version}`);
      } else if (result.type === 'ERROR') {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setStatus({
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
      toast.error('Fehler beim Prüfen auf Updates');
    }
  };

  const handleInstallUpdate = async () => {
    setStatus({ type: 'INSTALLING' });

    try {
      await installUpdate();
      // App will restart automatically after installation
    } catch (error) {
      console.error('Error installing update:', error);
      setStatus({
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Fehler bei der Installation'
      });
      toast.error('Fehler beim Installieren des Updates');
    }
  };

  if (!isTauri()) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Update-Funktion nicht verfügbar</AlertTitle>
        <AlertDescription>
          Automatische Updates sind nur in der Desktop-Version verfügbar.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Version */}
      {currentVersion && (
        <div className="text-sm text-muted-foreground">
          Aktuelle Version: <span className="font-mono font-semibold">{currentVersion}</span>
        </div>
      )}

      {/* Status Display */}
      {status.type === 'UPDATE_AVAILABLE' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Update verfügbar</AlertTitle>
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p>
                <strong>Version {status.version}</strong> vom{' '}
                {new Date(status.date).toLocaleDateString('de-DE')}
              </p>
              {status.body && (
                <div className="text-xs bg-white p-2 rounded border border-blue-200 mt-2">
                  <pre className="whitespace-pre-wrap">{status.body}</pre>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status.type === 'UP_TO_DATE' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Aktuell</AlertTitle>
          <AlertDescription className="text-green-800">
            Sie verwenden die neueste Version von CutPilot
          </AlertDescription>
        </Alert>
      )}

      {status.type === 'ERROR' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {status.type === 'INSTALLING' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-900">Installation läuft</AlertTitle>
          <AlertDescription className="text-blue-800">
            Das Update wird installiert. Die App startet gleich neu...
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCheckForUpdates}
          disabled={status.type === 'CHECKING' || status.type === 'INSTALLING'}
          variant="default"
        >
          {status.type === 'CHECKING' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Prüfe...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Auf Updates prüfen
            </>
          )}
        </Button>

        {status.type === 'UPDATE_AVAILABLE' && (
          <Button
            onClick={handleInstallUpdate}
            disabled={status.type === 'INSTALLING'}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Update installieren
          </Button>
        )}
      </div>
    </div>
  );
};
