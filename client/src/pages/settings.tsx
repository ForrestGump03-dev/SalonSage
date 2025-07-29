import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Download, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Info
} from "lucide-react";

interface UpdateStatus {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  lastChecked?: string;
}

interface UpdateCheck {
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);

  // Query per lo stato degli aggiornamenti
  const { data: updateStatus, isLoading: statusLoading } = useQuery<UpdateStatus>({
    queryKey: ["/api/updates/status"],
    refetchInterval: 60000, // Aggiorna ogni minuto
  });

  // Mutation per controllare aggiornamenti
  const checkUpdatesMutation = useMutation({
    mutationFn: async (): Promise<UpdateCheck> => {
      const response = await fetch("/api/updates/check", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to check updates");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.hasUpdate) {
        toast({
          title: "Aggiornamento disponibile!",
          description: `Versione ${data.version} è disponibile per il download.`,
        });
      } else {
        toast({
          title: "Nessun aggiornamento",
          description: "Stai già usando la versione più recente.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/updates/status"] });
      setIsCheckingUpdates(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile controllare gli aggiornamenti.",
        variant: "destructive",
      });
      setIsCheckingUpdates(false);
    },
  });

  // Mutation per installare aggiornamenti
  const installUpdateMutation = useMutation({
    mutationFn: async (downloadUrl: string) => {
      const response = await fetch("/api/updates/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadUrl }),
      });
      if (!response.ok) throw new Error("Failed to install update");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Installazione avviata",
        description: "L'applicazione si riavvierà automaticamente per completare l'aggiornamento.",
      });
      setIsInstallingUpdate(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile installare l'aggiornamento.",
        variant: "destructive",
      });
      setIsInstallingUpdate(false);
    },
  });

  // Mutation per backup
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backup", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create backup");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup creato",
        description: `Backup salvato in: ${data.backupPath}`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il backup.",
        variant: "destructive",
      });
    },
  });

  const handleCheckUpdates = () => {
    setIsCheckingUpdates(true);
    checkUpdatesMutation.mutate();
  };

  const handleInstallUpdate = async () => {
    if (!updateStatus?.updateAvailable) return;
    
    setIsInstallingUpdate(true);
    // Prima controlla per ottenere l'URL di download
    const updateCheck = await checkUpdatesMutation.mutateAsync();
    if (updateCheck.hasUpdate && updateCheck.downloadUrl) {
      installUpdateMutation.mutate(updateCheck.downloadUrl);
    } else {
      setIsInstallingUpdate(false);
      toast({
        title: "Errore",
        description: "URL di download non disponibile.",
        variant: "destructive",
      });
    }
  };

  const handleBackup = () => {
    backupMutation.mutate();
  };

  return (
    <Layout title="Impostazioni" subtitle="Configurazione e aggiornamenti dell'applicazione">
      <div className="space-y-6">
        {/* Informazioni applicazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informazioni Applicazione
            </CardTitle>
            <CardDescription>
              Dettagli sulla versione e lo stato dell'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Versione Corrente</p>
                <p className="text-lg font-semibold">{updateStatus?.currentVersion || "1.0.0"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stato</p>
                <Badge variant={updateStatus?.updateAvailable ? "secondary" : "default"}>
                  {updateStatus?.updateAvailable ? "Aggiornamento disponibile" : "Aggiornato"}
                </Badge>
              </div>
              {updateStatus?.lastChecked && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ultimo controllo</p>
                  <p className="text-sm">{new Date(updateStatus.lastChecked).toLocaleString()}</p>
                </div>
              )}
              {updateStatus?.latestVersion && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Versione più recente</p>
                  <p className="text-sm font-semibold">{updateStatus.latestVersion}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aggiornamenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Aggiornamenti Automatici
            </CardTitle>
            <CardDescription>
              Gestisci gli aggiornamenti dell'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {updateStatus?.updateAvailable && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  È disponibile un nuovo aggiornamento ({updateStatus.latestVersion}).
                  Si consiglia di installarlo per ottenere le ultime funzionalità e correzioni di sicurezza.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdates || statusLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                {isCheckingUpdates ? "Controllo..." : "Controlla Aggiornamenti"}
              </Button>

              {updateStatus?.updateAvailable && (
                <Button
                  onClick={handleInstallUpdate}
                  disabled={isInstallingUpdate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isInstallingUpdate ? "Installazione..." : "Installa Aggiornamento"}
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Gli aggiornamenti vengono controllati automaticamente ogni ora</p>
              <p>• L'applicazione si riavvierà automaticamente dopo l'installazione</p>
              <p>• I tuoi dati verranno preservati durante l'aggiornamento</p>
            </div>
          </CardContent>
        </Card>

        {/* Gestione Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Gestione Database
            </CardTitle>
            <CardDescription>
              Backup e gestione dei dati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                I tuoi dati sono salvati automaticamente in un database SQLite locale. 
                Tutti i dati persistono tra i riavvii dell'applicazione.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBackup}
                disabled={backupMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {backupMutation.isPending ? "Creazione backup..." : "Crea Backup"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• I backup vengono salvati nella cartella ./backups/</p>
              <p>• Si consiglia di creare backup regolari</p>
              <p>• Il database si trova in: ./data/salon_sage.db</p>
            </div>
          </CardContent>
        </Card>

        {/* Sicurezza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sicurezza e Licenza
            </CardTitle>
            <CardDescription>
              Informazioni sulla sicurezza e licenza
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                SalonSage utilizza un database locale SQLite per garantire che i tuoi dati rimangano 
                completamente privati e sotto il tuo controllo. Nessun dato viene mai inviato a server esterni.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
