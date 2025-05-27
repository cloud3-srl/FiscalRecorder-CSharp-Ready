import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Wifi, TestTube, CreditCard, Banknote, Smartphone, RefreshCw, Database, ExternalLink } from "lucide-react";
import { PaymentMethod, insertPaymentMethodSchema } from "@shared/schema";

// Schema per dispositivi POS
const posDeviceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nome è obbligatorio"),
  model: z.string().min(1, "Modello è obbligatorio"),
  connectionType: z.enum(["network", "usb", "bluetooth"]),
  ipAddress: z.string().optional(),
  port: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Schema per metodi di pagamento esteso
const paymentMethodSchema = insertPaymentMethodSchema.extend({
  id: z.number().optional(),
  connectionTest: z.boolean().optional(),
});

type PosDeviceFormValues = z.infer<typeof posDeviceSchema>;
type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

interface PosDevice {
  id: number;
  name: string;
  model: string;
  connectionType: "network" | "usb" | "bluetooth";
  ipAddress?: string;
  port?: string;
  isActive: boolean;
  status: "connected" | "disconnected" | "error";
}

export default function PaymentsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<PosDevice | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [syncingPaymentMethods, setSyncingPaymentMethods] = useState(false);

  // Queries per metodi di pagamento da database locale
  const { data: paymentMethods = [], refetch: refetchPaymentMethods, isLoading: isLoadingMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/settings/payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/settings/payment-methods');
      if (!response.ok) {
        console.error('Errore nel caricamento metodi di pagamento:', response.status, response.statusText);
        throw new Error('Errore nel caricamento metodi di pagamento');
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mock data per dispositivi POS (da implementare nelle API)
  const { data: posDevices = [] } = useQuery<PosDevice[]>({
    queryKey: ['/api/pos-devices'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: 1,
          name: "POS Principale",
          model: "Ingenico iWL250",
          connectionType: "network" as const,
          ipAddress: "192.168.1.100",
          port: "8080",
          isActive: true,
          status: "connected" as const,
        },
        {
          id: 2,
          name: "POS Mobile",
          model: "SumUp Air",
          connectionType: "bluetooth" as const,
          isActive: false,
          status: "disconnected" as const,
        }
      ];
    }
  });

  // Forms
  const deviceForm = useForm<PosDeviceFormValues>({
    resolver: zodResolver(posDeviceSchema),
    defaultValues: {
      name: "",
      model: "",
      connectionType: "network",
      ipAddress: "",
      port: "",
      isActive: true,
    },
  });

  const methodForm = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      code: "",
      description: "",
      type: "other",
      isActive: true,
      details: {},
    },
  });

  // Funzione per sincronizzare i metodi di pagamento
  const handleSyncPaymentMethods = async () => {
    setSyncingPaymentMethods(true);
    try {
      const response = await fetch('/api/admin/sync/payment-methods-now', { method: 'POST' });
      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Sincronizzazione completata",
          description: `${result.message} (Aggiornati: ${result.data?.updatedCount || 0})`,
        });
        refetchPaymentMethods();
      } else {
        toast({
          title: "Errore sincronizzazione",
          description: result.message || result.error || 'Errore sconosciuto',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la sincronizzazione",
        variant: "destructive",
      });
    } finally {
      setSyncingPaymentMethods(false);
    }
  };

  // Mutations per metodi di pagamento
  const { mutate: savePaymentMethod, isPending: isSavingMethod } = useMutation({
    mutationFn: async (data: PaymentMethodFormValues) => {
      const { id, connectionTest, ...methodData } = data;
      const url = id ? `/api/settings/payment-methods/${id}` : '/api/settings/payment-methods';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodData),
      });
      
      if (!response.ok) throw new Error('Errore nel salvataggio metodo di pagamento');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Metodo salvato", description: "Il metodo di pagamento è stato salvato con successo." });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payment-methods'] });
      setIsMethodDialogOpen(false);
      setEditingMethod(null);
      methodForm.reset();
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const { mutate: deletePaymentMethod } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/settings/payment-methods/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Errore nell\'eliminazione metodo di pagamento');
    },
    onSuccess: () => {
      toast({ title: "Metodo eliminato", description: "Il metodo di pagamento è stato eliminato." });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payment-methods'] });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleOpenDeviceDialog = (device?: PosDevice) => {
    if (device) {
      setEditingDevice(device);
      deviceForm.reset({
        id: device.id,
        name: device.name,
        model: device.model,
        connectionType: device.connectionType,
        ipAddress: device.ipAddress || "",
        port: device.port || "",
        isActive: device.isActive,
      });
    } else {
      setEditingDevice(null);
      deviceForm.reset();
    }
    setIsDeviceDialogOpen(true);
  };

  const handleOpenMethodDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      methodForm.reset({
        id: method.id,
        code: method.code,
        description: method.description,
        type: method.type,
        isActive: method.isActive ?? true,
        details: method.details || {},
      });
    } else {
      setEditingMethod(null);
      methodForm.reset();
    }
    setIsMethodDialogOpen(true);
  };

  const handleTestConnection = (deviceId: number) => {
    // Mock test connessione
    toast({
      title: "Test connessione",
      description: "Test connessione completato con successo",
    });
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'digital': return <Smartphone className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Contanti';
      case 'card': return 'Carta';
      case 'digital': return 'Digitale';
      case 'voucher': return 'Voucher';
      default: return 'Altro';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Sezione Codici di Pagamento */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardDescription className="mb-1">
                Metodi di pagamento importati dal database esterno tramite sincronizzazione
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSyncPaymentMethods}
                disabled={syncingPaymentMethods}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncingPaymentMethods ? 'animate-spin' : ''}`} />
                {syncingPaymentMethods ? 'Sincronizzando...' : 'Sincronizza Ora'}
              </Button>
              <Button variant="outline" onClick={() => window.open('/admin/database?tab=sincronizzazione', '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Gestione Sincronizzazione
              </Button>
              <Button onClick={() => handleOpenMethodDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Manualmente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMethods ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Caricamento metodi di pagamento...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ultima Sincronizzazione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-mono text-sm">{method.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(method.type)}
                          <span className="font-medium">{method.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getPaymentMethodTypeLabel(method.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={method.isActive ?? false} disabled />
                          <span className="text-sm text-muted-foreground">
                            {method.isActive ? 'Attivo' : 'Disattivo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {method.updatedAt ? new Date(method.updatedAt).toLocaleString('it-IT') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMethodDialog(method)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePaymentMethod(method.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoadingMethods && paymentMethods.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Nessun metodo di pagamento disponibile
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleSyncPaymentMethods}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizza dal Database Esterno
                </Button>
                <Button onClick={() => handleOpenMethodDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Manualmente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sezione Dispositivi POS */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardDescription>
                Configura i dispositivi POS collegati
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDeviceDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Nuovo Dispositivo POS
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Modello</TableHead>
                  <TableHead>Tipo Connessione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {device.connectionType === 'network' && <Wifi className="h-4 w-4" />}
                        {device.connectionType === 'bluetooth' && <Smartphone className="h-4 w-4" />}
                        <span className="capitalize">{device.connectionType}</span>
                        {device.ipAddress && <span className="text-sm text-muted-foreground">({device.ipAddress})</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={device.status === 'connected' ? 'default' : device.status === 'error' ? 'destructive' : 'secondary'}>
                        {device.status === 'connected' ? 'Connesso' : device.status === 'error' ? 'Errore' : 'Disconnesso'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDeviceDialog(device)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(device.id)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Delete logic */}}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Dispositivo POS */}
      <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? "Modifica Dispositivo" : "Nuovo Dispositivo"}
            </DialogTitle>
            <DialogDescription>
              {editingDevice ? "Modifica i dati del dispositivo POS" : "Aggiungi un nuovo dispositivo POS"}
            </DialogDescription>
          </DialogHeader>

          <Form {...deviceForm}>
            <form onSubmit={deviceForm.handleSubmit(() => {})} className="space-y-4">
              <FormField
                control={deviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome del dispositivo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deviceForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modello/Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Ingenico iWL250" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deviceForm.control}
                name="connectionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Connessione</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="network">Rete</SelectItem>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deviceForm.watch("connectionType") === "network" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={deviceForm.control}
                    name="ipAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzo IP</FormLabel>
                        <FormControl>
                          <Input placeholder="192.168.1.100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={deviceForm.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta</FormLabel>
                        <FormControl>
                          <Input placeholder="8080" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={deviceForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Attivo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Abilita questo dispositivo per i pagamenti
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDeviceDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit">
                  Salva
                </Button>
                <Button type="button" variant="secondary">
                  Test Connessione Dispositivo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Metodo di Pagamento */}
      <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Modifica Metodo Pagamento" : "Nuovo Metodo Pagamento"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? "Modifica il metodo di pagamento" : "Aggiungi un nuovo metodo di pagamento"}
            </DialogDescription>
          </DialogHeader>

          <Form {...methodForm}>
            <form onSubmit={methodForm.handleSubmit((data) => savePaymentMethod(data))} className="space-y-4">
              <FormField
                control={methodForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome del metodo di pagamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methodForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice univoco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methodForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Contanti</SelectItem>
                        <SelectItem value="card">Carta</SelectItem>
                        <SelectItem value="digital">Digitale</SelectItem>
                        <SelectItem value="voucher">Voucher</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methodForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Abilitato per la cassa</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mostra questo metodo durante il pagamento
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Campi specifici per tipo */}
              {methodForm.watch("type") === "digital" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Configurazione Specifica</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>API Key</Label>
                      <Input placeholder="Chiave API per il servizio" />
                    </div>
                    <div>
                      <Label>Endpoint</Label>
                      <Input placeholder="URL dell'endpoint" />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMethodDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSavingMethod}>
                  {isSavingMethod ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
