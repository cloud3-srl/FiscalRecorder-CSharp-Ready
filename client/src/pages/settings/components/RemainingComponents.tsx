import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DocumentsSettingsComponent from "./DocumentsSettings";

// Template component ottimizzato per tutte le sezioni
const SettingsTemplate = ({ description, buttonText }: { description: string; buttonText: string }) => (
  <div className="p-6 max-w-7xl mx-auto">
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Funzionalità in fase di sviluppo...</p>
      </CardContent>
    </Card>
  </div>
);

export function SaleModesSettings() {
  return <SettingsTemplate description="Configura le modalità di vendita" buttonText="Aggiungi Modalità" />;
}

// Import del componente stampanti completo
export { PrintersSettings } from "./printers/PrintersSettings";

export function BarcodeReadersSettings() {
  return <SettingsTemplate description="Configura i lettori di codici a barre" buttonText="Aggiungi Lettore" />;
}

export function ClientDisplaySettings() {
  return <SettingsTemplate description="Configura il display per il cliente" buttonText="Configura Display" />;
}

export function PaymentsSettings() {
  return <SettingsTemplate description="Configura i metodi di pagamento" buttonText="Aggiungi Metodo" />;
}

export function RolesSettings() {
  return <SettingsTemplate description="Gestisci i ruoli utente" buttonText="Aggiungi Ruolo" />;
}

export function OperatorsSettings() {
  return <SettingsTemplate description="Gestisci gli operatori" buttonText="Aggiungi Operatore" />;
}

export function DocumentsSettings() {
  return <DocumentsSettingsComponent />;
}

export function OrdersSettings() {
  return <SettingsTemplate description="Configura la gestione ordini" buttonText="Configura Ordini" />;
}

export function GeneralSettings() {
  return <GeneralSettingsComplete />;
}

// Componente completo per le impostazioni generali
function GeneralSettingsComplete() {
  const [audioSettings, setAudioSettings] = React.useState(() => {
    try {
      const saved = localStorage.getItem('fiscalrecorder.audioSettings');
      return saved ? JSON.parse(saved) : { beepEnabled: true, volume: 0.5 };
    } catch {
      return { beepEnabled: true, volume: 0.5 };
    }
  });

  const updateAudioSetting = (key: string, value: boolean | number) => {
    const newSettings = { ...audioSettings, [key]: value };
    setAudioSettings(newSettings);
    localStorage.setItem('fiscalrecorder.audioSettings', JSON.stringify(newSettings));
  };

  const testBeep = async () => {
    try {
      // Prova metodo migliorato con gestione errori
      const audio = new Audio('/beep.wav');
      audio.volume = audioSettings.volume;
      audio.preload = 'auto';
      
      // Aspetta che l'audio sia pronto
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });
      
      // Riproduci il suono
      await audio.play();
      console.log('Test audio completato con successo');
    } catch (error) {
      console.warn('Test audio fallito:', error);
      
      // Mostra un alert all'utente se il test fallisce
      alert('Impossibile riprodurre il suono. Verifica che:\n- I suoni del browser siano abilitati\n- Il volume del sistema sia attivo\n- Il file audio sia caricato correttamente');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Impostazioni Audio</CardTitle>
          <CardDescription>
            Configura i suoni del punto vendita
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Suono aggiunta prodotto
              </label>
              <p className="text-xs text-muted-foreground">
                Riproduci un beep quando viene aggiunto un prodotto al carrello
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={audioSettings.beepEnabled}
                onChange={(e) => updateAudioSetting('beepEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label="Abilita suono aggiunta prodotto"
              />
            </div>
          </div>

          {audioSettings.beepEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">
                  Volume suono
                </label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(audioSettings.volume * 100)}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioSettings.volume}
                  onChange={(e) => updateAudioSetting('volume', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  aria-label="Regola volume suono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testBeep}
                  className="px-3 py-1 text-xs"
                >
                  Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Altre Impostazioni</CardTitle>
          <CardDescription>
            Configurazioni aggiuntive dell'applicazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Altre impostazioni in fase di sviluppo...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ImportSettings() {
  return <SettingsTemplate description="Importa dati da file esterni" buttonText="Importa Dati" />;
}

// Export default per compatibilità
export default {
  SaleModesSettings,
  BarcodeReadersSettings,
  ClientDisplaySettings,
  PaymentsSettings,
  RolesSettings,
  OperatorsSettings,
  DocumentsSettings,
  OrdersSettings,
  GeneralSettings,
  ImportSettings,
};
