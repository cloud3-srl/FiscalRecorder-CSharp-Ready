import { PageHeader, PageTitle } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Play, Settings2, ListChecks, Users } from "lucide-react"; // Aggiunto Users
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Tipi di placeholder per lo stato della sincronizzazione
interface SyncStatus {
  lastSync: string | null;
  nextScheduledSync: string | null;
  isSyncing: boolean;
  progress: number; // 0-100
  statusMessage: string;
  error: string | null;
}

const initialSyncStatus: SyncStatus = {
  lastSync: null,
  nextScheduledSync: null,
  isSyncing: false,
  progress: 0,
  statusMessage: "Pronto",
  error: null,
};

export default function DbSyncPage() {
  const [productsSyncStatus, setProductsSyncStatus] = useState<SyncStatus>(initialSyncStatus);
  const [customersSyncStatus, setCustomersSyncStatus] = useState<SyncStatus>(initialSyncStatus);

  // TODO: Funzioni per recuperare lo stato attuale della sync dal backend (es. da databaseConfigs)
  // TODO: Funzioni per pianificare la sync

  const fetchSyncStatus = async () => {
    // Questa funzione dovrebbe recuperare lo stato dell'ultima sync per prodotti e clienti
    // Ad esempio, leggendo il campo lastSync dalla tabella databaseConfigs per la config attiva
    // Per ora, lo lasciamo simulato o da implementare con una nuova API
    try {
      const response = await fetch('/api/admin/database-configs'); // Esistente, prendiamo la attiva
      const configs = await response.json();
      const activeConfig = configs.find((c: any) => c.isActive);
      console.log("Active config per sync status:", activeConfig); // DEBUG
      if (activeConfig && activeConfig.lastSync) {
        const lastSyncDate = new Date(activeConfig.lastSync).toLocaleString();
        console.log("Last sync date da config:", lastSyncDate); // DEBUG
        // Assumiamo che lastSync si applichi a entrambi per ora, o che serva un campo per tipo
        setCustomersSyncStatus(prev => ({ ...prev, lastSync: lastSyncDate, statusMessage: "Pronto", isSyncing: false, progress: 0 }));
        setProductsSyncStatus(prev => ({ ...prev, lastSync: lastSyncDate, statusMessage: "Pronto", isSyncing: false, progress: 0 })); // TODO: distinguere lastSync per tipo
      } else {
        console.log("Nessuna active config con lastSync trovata."); //DEBUG
        setCustomersSyncStatus(prev => ({ ...prev, lastSync: null, statusMessage: "Pronto"}));
        setProductsSyncStatus(prev => ({ ...prev, lastSync: null, statusMessage: "Pronto"}));
      }
    } catch (error) {
      console.error("Errore nel recuperare lo stato della sync:", error);
      setCustomersSyncStatus(prev => ({ ...prev, lastSync: null, statusMessage: "Errore caricamento stato"}));
      setProductsSyncStatus(prev => ({ ...prev, lastSync: null, statusMessage: "Errore caricamento stato"}));
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const handleManualSync = async (type: 'products' | 'customers') => {
    const setStatus = type === 'products' ? setProductsSyncStatus : setCustomersSyncStatus;
    const endpoint = type === 'products' ? '/api/admin/sync/products-now' : '/api/admin/sync/customers-now'; // TODO: creare endpoint per prodotti

    setStatus(prev => ({ ...prev, isSyncing: true, progress: 0, statusMessage: "Avvio sincronizzazione...", error: null }));

    try {
      // Per ora, solo i clienti hanno un endpoint reale
      if (type === 'customers') {
        const response = await fetch(endpoint, { method: 'POST' });
        const result = await response.json();

        if (response.ok && result.success) {
          setStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            progress: 100, 
            statusMessage: `${result.message || "Sincronizzazione completata!"} (Aggiornati: ${result.updatedCount || 0}, Importati: ${result.importedCount || 0})`, 
            lastSync: new Date().toLocaleString(), 
            error: null 
          }));
          console.log("Risultato sync clienti:", result);
          // Richiama fetchSyncStatus per aggiornare dalla sorgente di verità (DB)
          fetchSyncStatus(); 
        } else {
          setStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            progress: 0, // o l'ultimo progresso valido
            statusMessage: `Errore: ${result.message || result.error || 'Errore sconosciuto'}`, 
            error: result.message || result.error || 'Errore sconosciuto'
          }));
        }
      } else {
        // Simula sync prodotti per ora
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            progress: 100, 
            statusMessage: "Sincronizzazione prodotti (simulata) completata!", 
            lastSync: new Date().toLocaleString(),
            error: null
          }));
      }
    } catch (error) {
      console.error(`Errore durante la sincronizzazione manuale (${type}):`, error);
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        statusMessage: `Errore di rete o API: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  };
  
  // TODO: UI e logica per la pianificazione
  const [isProductsSyncScheduled, setIsProductsSyncScheduled] = useState(false);
  const [isCustomersSyncScheduled, setIsCustomersSyncScheduled] = useState(false);


  return (
    <div className="space-y-6">
      <PageHeader>
        <PageTitle>Sincronizzazione Database</PageTitle>
        <p className="text-muted-foreground">
          Gestisci la sincronizzazione dei dati tra il database esterno e quello locale.
        </p>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Sincronizzazione Articoli */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListChecks className="mr-2 h-5 w-5" />
              Sincronizzazione Articoli
            </CardTitle>
            <CardDescription>
              Stato e gestione della sincronizzazione per l'anagrafica articoli.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Ultima Sincronizzazione:</p>
              <p className="text-sm text-muted-foreground">{productsSyncStatus.lastSync || "Mai eseguita"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Prossima Sincronizzazione Pianificata:</p>
              <p className="text-sm text-muted-foreground">{productsSyncStatus.nextScheduledSync || "Non pianificata"}</p>
            </div>
            {productsSyncStatus.isSyncing && (
              <div className="space-y-1">
                <Progress value={productsSyncStatus.progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{productsSyncStatus.statusMessage}</p>
              </div>
            )}
            {!productsSyncStatus.isSyncing && productsSyncStatus.statusMessage !== "Pronto" && (
              <div className={`flex items-center text-xs ${productsSyncStatus.error ? 'text-red-500' : 'text-green-500'}`}>
                {productsSyncStatus.error ? <AlertCircle className="mr-1 h-4 w-4" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                {productsSyncStatus.statusMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
             <div className="flex items-center space-x-2">
                <Switch 
                  id="schedule-products-sync" 
                  checked={isProductsSyncScheduled} 
                  onCheckedChange={setIsProductsSyncScheduled}
                  disabled // TODO: Abilitare quando la logica di pianificazione è pronta
                />
                <Label htmlFor="schedule-products-sync">Pianifica Sincronizzazione Automatica</Label>
            </div>
            <Button onClick={() => handleManualSync('products')} disabled={productsSyncStatus.isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${productsSyncStatus.isSyncing ? 'animate-spin' : ''}`} />
              Sincronizza Articoli Ora
            </Button>
          </CardFooter>
        </Card>

        {/* Card Sincronizzazione Clienti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Sincronizzazione Clienti
            </CardTitle>
            <CardDescription>
              Stato e gestione della sincronizzazione per l'anagrafica clienti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Ultima Sincronizzazione:</p>
              <p className="text-sm text-muted-foreground">{customersSyncStatus.lastSync || "Mai eseguita"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Prossima Sincronizzazione Pianificata:</p>
              <p className="text-sm text-muted-foreground">{customersSyncStatus.nextScheduledSync || "Non pianificata"}</p>
            </div>
            {customersSyncStatus.isSyncing && (
              <div className="space-y-1">
                <Progress value={customersSyncStatus.progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{customersSyncStatus.statusMessage}</p>
              </div>
            )}
             {!customersSyncStatus.isSyncing && customersSyncStatus.statusMessage !== "Pronto" && (
              <div className={`flex items-center text-xs ${customersSyncStatus.error ? 'text-red-500' : 'text-green-500'}`}>
                {customersSyncStatus.error ? <AlertCircle className="mr-1 h-4 w-4" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                {customersSyncStatus.statusMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <div className="flex items-center space-x-2">
                <Switch 
                  id="schedule-customers-sync" 
                  checked={isCustomersSyncScheduled} 
                  onCheckedChange={setIsCustomersSyncScheduled}
                  disabled // TODO: Abilitare quando la logica di pianificazione è pronta
                />
                <Label htmlFor="schedule-customers-sync">Pianifica Sincronizzazione Automatica</Label>
            </div>
            <Button onClick={() => handleManualSync('customers')} disabled={customersSyncStatus.isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${customersSyncStatus.isSyncing ? 'animate-spin' : ''}`} />
              Sincronizza Clienti Ora
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* TODO: Sezione per la pianificazione dettagliata (se non un modale separato) */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="mr-2 h-5 w-5" />
            Impostazioni di Pianificazione
          </CardTitle>
          <CardDescription>
            Configura la frequenza e le opzioni per la sincronizzazione automatica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>UI per la pianificazione (es. selezione tabelle, frequenza cron, ecc.) da implementare.</p>
        </CardContent>
        <CardFooter>
          <Button>Salva Pianificazione</Button>
        </CardFooter>
      </Card>
      */}
    </div>
  );
}
