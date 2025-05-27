import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { usePrintersDropdown } from "@/hooks/use-printers";
import "@/styles/pos.css";

const documentsSchema = z.object({
  // Scontrino
  receipt: z.object({
    defaultPrinter: z.string().optional(),
    printVatDetails: z.boolean().default(false),
    printDeferredPayment: z.boolean().default(false),
    courtesyPhrase: z.string().optional(),
  }),
  
  // Fattura  
  invoice: z.object({
    defaultPrinter: z.string().optional(),
    courtesyPhrase: z.string().optional(),
  }),
  
  // Conto
  account: z.object({
    enableCardPayments: z.boolean().default(false),
    defaultPrinter: z.string().optional(),
    printHeader: z.boolean().default(false),
    courtesyPhrase: z.string().optional(),
  }),
  
  // Copia conforme scontrino
  receiptCopy: z.object({
    defaultPrinter: z.string().optional(),
    courtesyPhrase: z.string().optional(),
  }),
  
  // Codice a barre
  barcode: z.object({
    defaultPrinter: z.string().optional(),
  }),
});

type DocumentsFormValues = z.infer<typeof documentsSchema>;

export default function DocumentsSettings() {
  const { toast } = useToast();
  const { options: printerOptions } = usePrintersDropdown();
  
  const form = useForm<DocumentsFormValues>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      receipt: {
        defaultPrinter: "none",
        printVatDetails: false,
        printDeferredPayment: false,
        courtesyPhrase: "",
      },
      invoice: {
        defaultPrinter: "none",
        courtesyPhrase: "",
      },
      account: {
        enableCardPayments: false,
        defaultPrinter: "none",
        printHeader: false,
        courtesyPhrase: "",
      },
      receiptCopy: {
        defaultPrinter: "none",
        courtesyPhrase: "",
      },
      barcode: {
        defaultPrinter: "none",
      },
    },
  });

  const onSubmit = (data: DocumentsFormValues) => {
    console.log("Saving documents settings:", data);
    toast({
      title: "Impostazioni salvate",
      description: "Le configurazioni dei documenti sono state aggiornate con successo.",
    });
  };

  return (
    <div className="fullscreen-form">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documenti</h1>
        <p className="text-muted-foreground">
          Configura le impostazioni di stampa per i documenti fiscali
        </p>
      </div>

      <Card className="fullscreen-card">
        <CardHeader>
          <CardTitle>Configurazione Documenti Fiscali</CardTitle>
          <CardDescription>
            Imposta le stampanti predefinite e le opzioni di stampa per ogni tipo di documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="form-two-columns">
                {/* COLONNA SINISTRA */}
                <div className="form-section">
                  {/* SCONTRINO */}
                  <div className="space-y-6">
                    <h3 className="form-section-title">Scontrino</h3>
                    
                    <FormField
                      control={form.control}
                      name="receipt.defaultPrinter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stampante di default</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="enhanced-input">
                                <SelectValue placeholder="Seleziona stampante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receipt.printVatDetails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Stampa dettaglio per aliquote IVA
                            </FormLabel>
                            <FormDescription>
                              Includi il dettaglio delle aliquote IVA nello scontrino
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receipt.printDeferredPayment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Stampa ricevuta per pagamento differito
                            </FormLabel>
                            <FormDescription>
                              Stampa automaticamente ricevuta per pagamenti differiti
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receipt.courtesyPhrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frase di cortesia</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Grazie per la visita!"
                              className="enhanced-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Frase stampata in fondo allo scontrino
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* FATTURA */}
                  <div className="space-y-6 mt-8">
                    <h3 className="form-section-title">Fattura</h3>
                    
                    <FormField
                      control={form.control}
                      name="invoice.defaultPrinter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stampante di default</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="enhanced-input">
                                <SelectValue placeholder="Seleziona stampante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoice.courtesyPhrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frase di cortesia</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Grazie per la fiducia!"
                              className="enhanced-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Frase stampata in fondo alla fattura
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* COLONNA DESTRA */}
                <div className="form-section">
                  {/* CONTO */}
                  <div className="space-y-6">
                    <h3 className="form-section-title">Conto</h3>
                    
                    <FormField
                      control={form.control}
                      name="account.enableCardPayments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Abilitazione pagamenti Bancomat e carta di credito
                            </FormLabel>
                            <FormDescription>
                              Permetti pagamenti con carte nei conti
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account.defaultPrinter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stampante di default</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="enhanced-input">
                                <SelectValue placeholder="Seleziona stampante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account.printHeader"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Stampa intestazione
                            </FormLabel>
                            <FormDescription>
                              Includi l'intestazione aziendale nel conto
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account.courtesyPhrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frase di cortesia</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Servizio al tavolo"
                              className="enhanced-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Frase stampata nel conto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* COPIA CONFORME SCONTRINO */}
                  <div className="space-y-6 mt-8">
                    <h3 className="form-section-title">Copia conforme scontrino</h3>
                    
                    <FormField
                      control={form.control}
                      name="receiptCopy.defaultPrinter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stampante di default</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="enhanced-input">
                                <SelectValue placeholder="Seleziona stampante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receiptCopy.courtesyPhrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frase di cortesia</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Copia per i vostri archivi"
                              className="enhanced-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Frase stampata nella copia conforme
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* CODICE A BARRE */}
                  <div className="space-y-6 mt-8">
                    <h3 className="form-section-title">Codice a barre</h3>
                    
                    <FormField
                      control={form.control}
                      name="barcode.defaultPrinter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stampante di default</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="enhanced-input">
                                <SelectValue placeholder="Seleziona stampante" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Stampante per etichette con codici a barre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Pulsante Salva */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button type="submit" size="lg" className="px-8">
                  Salva Configurazioni
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
