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

// Import del componente GeneralSettings completo
export { default as GeneralSettings } from "./GeneralSettings";

export function ImportSettings() {
  return <SettingsTemplate description="Importa dati da file esterni" buttonText="Importa Dati" />;
}

// Export default per compatibilità (GeneralSettings rimosso perché già esportato direttamente)
export default {
  SaleModesSettings,
  BarcodeReadersSettings,
  ClientDisplaySettings,
  PaymentsSettings,
  RolesSettings,
  OperatorsSettings,
  DocumentsSettings,
  OrdersSettings,
  ImportSettings,
};
