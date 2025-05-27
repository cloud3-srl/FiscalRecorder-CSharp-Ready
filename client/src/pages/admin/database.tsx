import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, Database, CheckCircle, XCircle, Play, Plus, Trash2, 
  RefreshCw, Edit, AlertTriangle, X 
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as schema from "@shared/schema";
import { insertDatabaseConfigSchema, databaseConfigOptionsSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import DbSyncPage from "./db-sync";

// Schema per il form esteso con i campi specifici MSSQL e tabelle di sincronizzazione
const databaseConfigFormSchema = insertDatabaseConfigSchema.extend({
  id: z.number().optional(),
  port: z.number().default(1433),
  encrypt: z.boolean().default(true),
  trustServerCertificate: z.boolean().default(false),
  // Campi per i nomi delle tabelle di sincronizzazione
  productTableName: z.string().optional(),
  customerTableNamePattern: z.string().optional(),
  paymentMethodTableName: z.string().optional(),
  defaultCompanyCode: z.string().optional(),
});
type DatabaseConfigFormValues = z.infer<typeof databaseConfigFormSchema>;

// Tipo per le info del DB locale
type LocalDbInfo = {
  status: string;
  type: string;
  host?: string;
  port?: string;
  dbName?: string;
  user?: string;
  size?: string;
  uptime?: string;
  version?: string;
  connections?: number;
  url?: string;
  detailParsingFailed?: boolean;
};

export default function DatabaseConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("configurazione");
  const [testingConnection, setTestingConnection] = useState(false);
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<schema.DatabaseConfig | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Query per configurazioni database
  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery<schema.DatabaseConfig[], Error>({
    queryKey: ['/api/admin/database-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/database-configs');
      if (!response.ok) throw new Error('Errore nel caricamento configurazioni');
      return response.json();
    }
  });

  // Query per logs connessione
  const { data: connectionLogs = [] } = useQuery<Array<{
    id: number;
    configId: number;
    timestamp: string;
    status: string;
    message: string;
    duration: number;
  }>>({
    queryKey: ['/api/admin/connection-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/connection-logs');
      if (!response.ok) throw new Error('Errore nel caricamento logs');
      return response.json();
    }
  });

  // Query per info DB locale
  const { data: localDbInfo, isLoading: isLoadingLocalDbInfo, refetch: refetchLocalDbInfo } = useQuery<{
    success: boolean;
    data?: LocalDbInfo;
    error?: string;
  }>({
    queryKey: ['/api/admin/local-db-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/local-db-status');
      if (!response.ok) throw new Error('Errore nel caricamento stato DB locale');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Form per configurazione
  const form = useForm<DatabaseConfigFormValues>({
    resolver: zodResolver(databaseConfigFormSchema),
    defaultValues: {
      name: "",
      driver: "mssql",
      server: "",
      database: "",
      username: "",
      password: "",
      port: 1433,
      encrypt: true,
      trustServerCertificate: false,
      isActive: false,
    },
  });

  // Reset form quando editing config cambia
  useEffect(() => {
    if (editingConfig) {
      const options = editingConfig.options as any || {};
      const syncTableNames = options.syncTableNames || {};
      
      form.reset({
        id: editingConfig.id,
        name: editingConfig.name,
        driver: editingConfig.driver,
        server: editingConfig.server,
        database: editingConfig.database,
        username: editingConfig.username,
        password: editingConfig.password,
        port: options.port || 1433,
        encrypt: options.encrypt ?? true,
        trustServerCertificate: options.trustServerCertificate ?? false,
        isActive: editingConfig.isActive || false,
        options: editingConfig.options as any,
        // Campi per le tabelle di sincronizzazione
        productTableName: syncTableNames.products || "",
        customerTableNamePattern: syncTableNames.customers || "",
        paymentMethodTableName: syncTableNames.paymentMethods || "",
        defaultCompanyCode: options.defaultCompanyCodeForSync || "",
      });
    } else {
      form.reset({
        name: "",
        driver: "mssql",
        server: "",
        database: "",
        username: "",
        password: "",
        port: 1433,
        encrypt: true,
        trustServerCertificate: false,
        isActive: false,
        productTableName: "",
        customerTableNamePattern: "",
        paymentMethodTableName: "",
        defaultCompanyCode: "",
      });
    }
  }, [editingConfig, form]);

  // Mutation per salvare configurazione
  const { mutate: saveConfigMutation, isPending: isSaving } = useMutation<
    schema.DatabaseConfig,
    Error,
    DatabaseConfigFormValues
  >({
    mutationFn: async (data) => {
      const { 
        port, encrypt, trustServerCertificate, 
        productTableName, customerTableNamePattern, paymentMethodTableName, defaultCompanyCode,
        ...baseData 
      } = data;
      
      // Prepara i dati per l'API con tutte le opzioni
      const configData = {
        ...baseData,
        options: {
          ...(baseData.options as any || {}),
          port,
          encrypt,
          trustServerCertificate,
          syncTableNames: {
            products: productTableName || undefined,
            customers: customerTableNamePattern || undefined,
            paymentMethods: paymentMethodTableName || undefined,
          },
          defaultCompanyCodeForSync: defaultCompanyCode || undefined,
        },
      };

      const url = data.id ? `/api/admin/database-configs/${data.id}` : '/api/admin/database-configs';
      const method = data.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      
      if (!response.ok) throw new Error('Errore nel salvataggio configurazione');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione database è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-configs'] });
      setShowNewConfigForm(false);
      setIsFormModalOpen(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare configurazione
  const { mutate: deleteConfig, isPending: isDeletingConfig } = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/database-configs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Errore nell\'eliminazione configurazione');
    },
    onSuccess: () => {
      toast({
        title: "Configurazione eliminata",
        description: "La configurazione è stata eliminata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per attivare configurazione
  const { mutate: toggleActiveMutation, isPending: isTogglingActive } = useMutation<
    schema.DatabaseConfig,
    Error,
    number
  >({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/database-configs/${id}/toggle-active`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Errore nell\'attivazione configurazione');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione attivata",
        description: "La configurazione è stata attivata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connessione
  const testConnection = async (config: schema.DatabaseConfig) => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Connessione riuscita",
          description: "La connessione al database è stata stabilita con successo.",
        });
      } else {
        toast({
          title: "Connessione fallita",
          description: result.error || "Impossibile connettersi al database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Errore durante il test di connessione.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/connection-logs'] });
    }
  };

  // Funzione per ottenere l'ultima connessione riuscita
  const getLastSuccessfulConnection = (configId: number) => {
    const successfulLogs = connectionLogs
      .filter(log => log.configId === configId && log.status === 'success')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return successfulLogs.length > 0 ? successfulLogs[0] : null;
  };

  // Handlers
  const handleSaveConfig = (data: DatabaseConfigFormValues) => {
    saveConfigMutation(data);
  };

  const handleOpenNewConfigForm = () => {
    setEditingConfig(null);
    setShowNewConfigForm(true);
  };

  const handleCancelNewConfig = () => {
    setShowNewConfigForm(false);
    form.reset();
  };

  const handleOpenEditConfigModal = (config: schema.DatabaseConfig) => {
    setEditingConfig(config);
    setIsFormModalOpen(true);
  };

  const handleDeleteConfig = (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa configurazione?')) {
      deleteConfig(id);
    }
  };

  if (isLoadingConfigs) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Gestione Database</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="configurazione">
          <TabsList className="mb-6">
            <TabsTrigger value="configurazione">Configurazione</TabsTrigger>
            <TabsTrigger value="sincronizzazione">Sincronizzazione</TabsTrigger>
            <TabsTrigger value="query">Query SQL</TabsTrigger>
            <TabsTrigger value="log">Log Connessioni</TabsTrigger>
          </TabsList>

          <TabsContent value="configurazione">
            <div className="space-y-6">
              {/* Pulsante Nuova Configurazione */}
              {!showNewConfigForm && (
                <div className="flex justify-start">
                  <Button onClick={handleOpenNewConfigForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuova Configurazione
                  </Button>
                </div>
              )}

              {/* Form Nuova Configurazione (condizionale) */}
              {showNewConfigForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nuova Configurazione</CardTitle>
                    <CardDescription>
                      La finestra con i campi relativi all'aggiunta di una nuova configurazione dovranno comparire solo una volta cliccato su "nuova configurazione"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSaveConfig)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Configurazione *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Es. DB Produzione" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="server"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Server *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Es. localhost" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Porta</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1433)} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="database"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Database *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome database" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password *</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Sezione Configurazione Tabelle di Sincronizzazione */}
                        <div className="space-y-4 pt-6 border-t">
                          <h3 className="text-lg font-semibold">Configurazione Tabelle di Sincronizzazione</h3>
                          <p className="text-sm text-muted-foreground">
                            Specifica i nomi delle tabelle sorgente per ogni tipo di sincronizzazione. 
                            Lascia vuoto per utilizzare i nomi predefiniti.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="productTableName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Tabella Prodotti</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="C3EXPPOS (predefinito)" 
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerTableNamePattern"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pattern Tabella Clienti</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="{companyCode}CONTI (predefinito)" 
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Usa {"{companyCode}"} come placeholder per il codice azienda
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="paymentMethodTableName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Tabella Metodi Pagamento</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="SCARLPAG_AMEN (predefinito)" 
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="defaultCompanyCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    Codice Azienda
                                    <span 
                                      className="text-blue-500 cursor-help text-sm"
                                      title="SQL: select AZRAGAZI,AZINDAZI,AZLOCAZI,AZCAPAZI,AZPROAZI,AZCODNAZ,AZCOFAZI,AZIVAAZI from azienda where azcodazi = 'codice'"
                                    >
                                      ?
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Es. SCARL" 
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Usato per filtrare i dati durante la sincronizzazione
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={handleCancelNewConfig}>
                            <X className="mr-2 h-4 w-4" />
                            Annulla
                          </Button>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salva Configurazione
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Configurazioni Salvate */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurazioni salvate</CardTitle>
                  <CardDescription>
                    Selettore configurazioni salvate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nessuna configurazione salvata
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {configs.map((config) => {
                        const lastConnection = getLastSuccessfulConnection(config.id);
                        const options = config.options as any || {};
                        return (
                          <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {config.isActive && <CheckCircle className="h-5 w-5 text-green-500" />}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold">{config.name}</h3>
                                  {config.isActive && <Badge variant="default">Attiva</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {config.server}:{options.port || 1433} / {config.database}
                                </p>
                                {config.lastSync && (
                                  <p className="text-xs text-muted-foreground">
                                    Ultima sincronizzazione: {new Date(config.lastSync).toLocaleString('it-IT')}
                                  </p>
                                )}
                                {lastConnection && (
                                  <p className="text-xs text-green-600">
                                    Ultima connessione riuscita: {new Date(lastConnection.timestamp).toLocaleString('it-IT')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testConnection(config)}
                                disabled={testingConnection}
                              >
                                {testingConnection ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                Test
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActiveMutation(config.id)}
                                disabled={config.isActive || isTogglingActive}
                              >
                                {config.isActive ? "Attiva" : "Imposta come Attiva"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditConfigModal(config)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteConfig(config.id)}
                                disabled={config.isActive || isDeletingConfig}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configurazione DB Locale */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Configurazione db locale</span>
                  </CardTitle>
                  <CardDescription>
                    Inserire informazioni sul db locale, stato di salute se è in uso, eventuale possibilità di riavvio del servizio, dimensione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLocalDbInfo ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Caricamento informazioni database locale...</span>
                    </div>
                  ) : localDbInfo?.success && localDbInfo.data ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Stato</p>
                          <div className="flex items-center space-x-2">
                            {localDbInfo.data.status === 'online' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="capitalize">{localDbInfo.data.status}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Tipo Database</p>
                          <p className="text-sm">{localDbInfo.data.type}</p>
                        </div>
                        {localDbInfo.data.size && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Dimensione</p>
                            <p className="text-sm">{localDbInfo.data.size}</p>
                          </div>
                        )}
                        {localDbInfo.data.connections !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Connessioni</p>
                            <p className="text-sm">{localDbInfo.data.connections}</p>
                          </div>
                        )}
                      </div>
                      
                      {!localDbInfo.data.detailParsingFailed && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Host</p>
                            <p className="text-sm">{localDbInfo.data.host}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Porta</p>
                            <p className="text-sm">{localDbInfo.data.port}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Database</p>
                            <p className="text-sm">{localDbInfo.data.dbName}</p>
                          </div>
                        </div>
                      )}
                      
                      {localDbInfo.data.version && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Versione</p>
                          <p className="text-sm">{localDbInfo.data.version}</p>
                        </div>
                      )}
                      
                      {localDbInfo.data.uptime && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Uptime</p>
                          <p className="text-sm">{localDbInfo.data.uptime}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchLocalDbInfo()}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Aggiorna Stato
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Errore nel caricamento informazioni database locale: {localDbInfo?.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sincronizzazione">
            <DbSyncPage />
          </TabsContent>

          <TabsContent value="query">
            <Card>
              <CardHeader>
                <CardTitle>Esecuzione Query SQL</CardTitle>
                <CardDescription>
                  Esegui query personalizzate sul database esterno configurato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Attenzione:</strong> Le query vengono eseguite direttamente sul database esterno. 
                      Fai attenzione con le operazioni di modifica (UPDATE, DELETE, INSERT).
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Query SQL</label>
                    <textarea 
                      className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                      placeholder="Inserisci qui la tua query SQL..."
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button disabled>
                      <Play className="mr-2 h-4 w-4" />
                      Esegui Query
                    </Button>
                    <Button variant="outline" disabled>
                      Cancella
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Area test per l'esecuzione di query SQL personalizzate
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle>Log Connessioni</CardTitle>
                <CardDescription>
                  Storico delle connessioni ai database esterni
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectionLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun log di connessione disponibile
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Ora</TableHead>
                        <TableHead>Configurazione</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Durata (ms)</TableHead>
                        <TableHead>Messaggio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectionLogs.slice(0, 50).map((log) => {
                        const config = configs.find(c => c.id === log.configId);
                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString('it-IT')}
                            </TableCell>
                            <TableCell>{config?.name || `ID: ${log.configId}`}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {log.status === 'success' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="capitalize">{log.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{log.duration}</TableCell>
                            <TableCell>{log.message}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog per Modifica Configurazione */}
      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
        setIsFormModalOpen(isOpen);
        if (!isOpen) setEditingConfig(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Configurazione</DialogTitle>
            <DialogDescription>
              Modifica i parametri della configurazione database
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveConfig)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Configurazione *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. DB Produzione" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. localhost" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porta</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1433)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="database"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome database" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sezione Configurazione Tabelle di Sincronizzazione nel Dialog */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Configurazione Tabelle di Sincronizzazione</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productTableName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Tabella Prodotti</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="C3EXPPOS (predefinito)" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerTableNamePattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pattern Tabella Clienti</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="CODICEAZIENDA+CONTI" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethodTableName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Tabella Metodi Pagamento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="SCARLPAG_AMEN (predefinito)" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultCompanyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Azienda</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Es. SCARL" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salva Modifiche
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
