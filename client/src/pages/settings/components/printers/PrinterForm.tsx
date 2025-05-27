import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Upload, Eye, TestTube, Save, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailSection } from "../shared/MasterDetailLayout";
import { 
  PrinterFormData, 
  printerConfigSchema, 
  PRINTER_TYPES, 
  CONNECTION_METHODS, 
  PAPER_WIDTHS,
  DEFAULT_PRINTER_CONFIG,
  calculateCharactersPerLine,
  ConnectionTestResult
} from "./types";

interface PrinterFormProps {
  printer?: PrinterFormData;
  onSave: (data: PrinterFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onTestConnection: (data: PrinterFormData) => Promise<ConnectionTestResult>;
  isLoading?: boolean;
  isNew?: boolean;
}

export function PrinterForm({
  printer,
  onSave,
  onDelete,
  onTestConnection,
  isLoading = false,
  isNew = false
}: PrinterFormProps) {
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<PrinterFormData>({
    resolver: zodResolver(printerConfigSchema.omit({ id: true, createdAt: true, updatedAt: true, lastConnectionTest: true })),
    defaultValues: printer || DEFAULT_PRINTER_CONFIG,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid, isDirty } } = form;
  
  const watchedValues = watch();
  const connectionMethod = watch("connectionMethod");
  const paperWidth = watch("paperWidth");
  const logoEnabled = watch("logoEnabled");

  // Auto-calcola caratteri per riga quando cambia larghezza carta
  useEffect(() => {
    if (paperWidth) {
      const chars = calculateCharactersPerLine(paperWidth);
      setValue("charactersPerLine", chars);
    }
  }, [paperWidth, setValue]);

  // Reset risultato test quando cambiano parametri di connessione
  useEffect(() => {
    setConnectionTestResult(null);
  }, [connectionMethod, watchedValues.ipAddress, watchedValues.port, watchedValues.usbPort]);

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      setConnectionTestResult(null);
      
      const result = await onTestConnection(watchedValues);
      setConnectionTestResult(result);
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Errore durante il test"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setValue("logoImage", result);
        setLogoPreview(result);
        setValue("logoEnabled", true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (data: PrinterFormData) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
      
      {/* Sezione Informazioni Base */}
      <DetailSection
        title="Informazioni Base"
        description="Configurazione generale della stampante"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="es. Cassa Principale"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo Stampante *</Label>
            <Select
              value={watchedValues.type}
              onValueChange={(value) => setValue("type", value as any)}
            >
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRINTER_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrizione</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Descrizione opzionale della stampante"
            rows={3}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
      </DetailSection>

      <Separator />

      {/* Sezione Connessione */}
      <DetailSection
        title="Connessione"
        description="Configura il metodo di connessione alla stampante"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Metodo Connessione *</Label>
            <RadioGroup
              value={connectionMethod}
              onValueChange={(value) => setValue("connectionMethod", value as any)}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {Object.entries(CONNECTION_METHODS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={label} id={key} />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Campi specifici per tipo di connessione */}
          {connectionMethod === CONNECTION_METHODS.ETHERNET && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="ipAddress">Indirizzo IP *</Label>
                <Input
                  id="ipAddress"
                  {...register("ipAddress")}
                  placeholder="192.168.1.100"
                  className={errors.ipAddress ? "border-red-500" : ""}
                />
                {errors.ipAddress && (
                  <p className="text-sm text-red-500">{errors.ipAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  {...register("port", { valueAsNumber: true })}
                  placeholder="9100"
                  className={errors.port ? "border-red-500" : ""}
                />
                {errors.port && (
                  <p className="text-sm text-red-500">{errors.port.message}</p>
                )}
              </div>
            </div>
          )}

          {connectionMethod === CONNECTION_METHODS.USB && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="usbPort">Porta USB</Label>
                <Select
                  value={watchedValues.usbPort || ""}
                  onValueChange={(value) => setValue("usbPort", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona porta USB" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USB001">USB001 (Porta 1)</SelectItem>
                    <SelectItem value="USB002">USB002 (Porta 2)</SelectItem>
                    <SelectItem value="COM1">COM1</SelectItem>
                    <SelectItem value="COM2">COM2</SelectItem>
                    <SelectItem value="LPT1">LPT1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {connectionMethod === CONNECTION_METHODS.WIFI && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="wifiSSID">Nome WiFi (SSID)</Label>
                <Input
                  id="wifiSSID"
                  {...register("wifiSSID")}
                  placeholder="NomeReteWiFi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifiPassword">Password WiFi</Label>
                <Input
                  id="wifiPassword"
                  type="password"
                  {...register("wifiPassword")}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {connectionMethod === CONNECTION_METHODS.BLUETOOTH && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="bluetoothAddress">Indirizzo Bluetooth</Label>
                <Input
                  id="bluetoothAddress"
                  {...register("bluetoothAddress")}
                  placeholder="00:11:22:33:44:55"
                />
                <p className="text-sm text-muted-foreground">
                  Inserisci l'indirizzo MAC del dispositivo Bluetooth
                </p>
              </div>
            </div>
          )}

          {/* Test Connessione */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !connectionMethod}
              className="flex items-center gap-2"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connessione
            </Button>

            {connectionTestResult && (
              <Alert className={`flex-1 ${connectionTestResult.success ? 'border-green-500' : 'border-red-500'}`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {connectionTestResult.message}
                  {connectionTestResult.duration && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({connectionTestResult.duration}ms)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DetailSection>

      <Separator />

      {/* Sezione Configurazione Carta */}
      <DetailSection
        title="Configurazione Carta"
        description="Imposta formato carta e margini di stampa"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paperWidth">Larghezza Carta</Label>
            <Select
              value={paperWidth}
              onValueChange={(value) => setValue("paperWidth", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_WIDTHS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="charactersPerLine">Caratteri per Riga</Label>
            <Input
              id="charactersPerLine"
              type="number"
              {...register("charactersPerLine", { valueAsNumber: true })}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="md:col-span-2 flex items-center space-x-2">
            <Checkbox
              id="autoCut"
              checked={watchedValues.autoCut}
              onCheckedChange={(checked) => setValue("autoCut", checked as boolean)}
            />
            <Label htmlFor="autoCut">Taglio Automatico</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marginTop">Margine Superiore (mm)</Label>
            <Input
              id="marginTop"
              type="number"
              {...register("marginTop", { valueAsNumber: true })}
              min="0"
              max="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marginBottom">Margine Inferiore (mm)</Label>
            <Input
              id="marginBottom"
              type="number"
              {...register("marginBottom", { valueAsNumber: true })}
              min="0"
              max="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marginLeft">Margine Sinistro (mm)</Label>
            <Input
              id="marginLeft"
              type="number"
              {...register("marginLeft", { valueAsNumber: true })}
              min="0"
              max="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marginRight">Margine Destro (mm)</Label>
            <Input
              id="marginRight"
              type="number"
              {...register("marginRight", { valueAsNumber: true })}
              min="0"
              max="10"
            />
          </div>
        </div>
      </DetailSection>

      <Separator />

      {/* Sezione Layout Stampa */}
      <DetailSection
        title="Layout Stampa"
        description="Personalizza l'aspetto dei documenti stampati"
      >
        <div className="space-y-6">
          {/* Logo Aziendale */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="logoEnabled"
                checked={logoEnabled}
                onCheckedChange={(checked) => setValue("logoEnabled", checked as boolean)}
              />
              <Label htmlFor="logoEnabled">Logo Aziendale</Label>
            </div>

            {logoEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Carica Logo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Seleziona File
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoWidth">Larghezza (px)</Label>
                      <Input
                        id="logoWidth"
                        type="number"
                        {...register("logoWidth", { valueAsNumber: true })}
                        min="50"
                        max="200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoHeight">Altezza (px)</Label>
                      <Input
                        id="logoHeight"
                        type="number"
                        {...register("logoHeight", { valueAsNumber: true })}
                        min="20"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Logo */}
                <div className="space-y-2">
                  <Label>Anteprima Logo</Label>
                  <Card className="p-4 bg-muted/30">
                    <CardContent className="p-0">
                      {logoPreview || watchedValues.logoImage ? (
                        <img
                          src={logoPreview || watchedValues.logoImage}
                          alt="Logo preview"
                          className="max-w-full h-auto border rounded"
                          style={{
                            width: watchedValues.logoWidth,
                            height: watchedValues.logoHeight
                          }}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          Nessun logo caricato
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Header e Footer personalizzati */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headerText">Header Personalizzato</Label>
              <Textarea
                id="headerText"
                {...register("headerText")}
                placeholder="Testo aggiuntivo in intestazione"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Personalizzato</Label>
              <Textarea
                id="footerText"
                {...register("footerText")}
                placeholder="Testo aggiuntivo in chiusura"
                rows={3}
              />
            </div>
          </div>

          {/* Codice QR */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qrCodeEnabled"
              checked={watchedValues.qrCodeEnabled}
              onCheckedChange={(checked) => setValue("qrCodeEnabled", checked as boolean)}
            />
            <Label htmlFor="qrCodeEnabled">Includi Codice QR nelle ricevute</Label>
          </div>
        </div>
      </DetailSection>

      <Separator />

      {/* Sezione Documenti Assegnati */}
      <DetailSection
        title="Documenti Assegnati"
        description="Seleziona quali tipi di documento stampare con questa stampante"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="printReceipts"
              checked={watchedValues.printReceipts}
              onCheckedChange={(checked) => setValue("printReceipts", checked as boolean)}
            />
            <Label htmlFor="printReceipts">Scontrini Fiscali</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printNonFiscalReceipts"
              checked={watchedValues.printNonFiscalReceipts}
              onCheckedChange={(checked) => setValue("printNonFiscalReceipts", checked as boolean)}
            />
            <Label htmlFor="printNonFiscalReceipts">Ricevute Non Fiscali</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printOrders"
              checked={watchedValues.printOrders}
              onCheckedChange={(checked) => setValue("printOrders", checked as boolean)}
            />
            <Label htmlFor="printOrders">Comande</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printReports"
              checked={watchedValues.printReports}
              onCheckedChange={(checked) => setValue("printReports", checked as boolean)}
            />
            <Label htmlFor="printReports">Report Vendite</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printInvoices"
              checked={watchedValues.printInvoices}
              onCheckedChange={(checked) => setValue("printInvoices", checked as boolean)}
            />
            <Label htmlFor="printInvoices">Fatture</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printLabels"
              checked={watchedValues.printLabels}
              onCheckedChange={(checked) => setValue("printLabels", checked as boolean)}
            />
            <Label htmlFor="printLabels">Etichette Prezzi</Label>
          </div>
        </div>
      </DetailSection>

      <Separator />

      {/* Azioni */}
      <div className="flex justify-between items-center pt-4">
        <div>
          {!isNew && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Elimina Stampante
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!isValid || isLoading}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Anteprima Layout
          </Button>

          <Button
            type="submit"
            disabled={!isValid || !isDirty || isLoading}
            className="bg-cassanova-primary hover:bg-cassanova-primary/90 text-white flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Crea Stampante" : "Salva Modifiche"}
          </Button>
        </div>
      </div>
    </form>
  );
}
