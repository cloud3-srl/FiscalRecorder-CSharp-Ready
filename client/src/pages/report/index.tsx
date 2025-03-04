import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Printer, Loader2, RefreshCw, Upload } from "lucide-react";
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
import { insertPrinterConfigSchema } from "@shared/schema";

export default function ReportPage() {
  const { toast } = useToast();
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  // Query per ottenere la configurazione attuale
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/admin/printer-config'],
  });

  const form = useForm({
    resolver: zodResolver(insertPrinterConfigSchema),
    defaultValues: {
      name: "Configurazione predefinita",
      printerName: "",
      paperWidth: 140,
      paperHeight: 199,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      headerText: "",
      footerText: "",
      logoEnabled: false,
      logoImage: "",
      logoWidth: 120,
      logoHeight: 40
    }
  });

  // Mutation per salvare la configurazione
  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/printer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile salvare la configurazione');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/printer-config'] });
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni della stampante sono state aggiornate"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione",
        variant: "destructive"
      });
    }
  });

  const refreshPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const response = await fetch('/api/admin/available-printers');
      if (!response.ok) throw new Error('Impossibile ottenere la lista delle stampanti');
      const printers = await response.json();
      setAvailablePrinters(printers);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile ottenere la lista delle stampanti",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewLogo(base64);
        form.setValue('logoImage', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Configurazione Stampante</h1>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveConfig(data))} className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Impostazioni Stampante</h2>
                  <p className="text-sm text-muted-foreground">
                    Configura la stampante e il layout dello scontrino
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshPrinters}
                  disabled={isLoadingPrinters}
                >
                  {isLoadingPrinters ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Aggiorna stampanti
                </Button>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome configurazione</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="printerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stampante</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Seleziona una stampante</option>
                        {availablePrinters.map(printer => (
                          <option key={printer} value={printer}>
                            {printer}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paperWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Larghezza carta (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paperHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altezza carta (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marginTop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margine superiore (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marginBottom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margine inferiore (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="headerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testo intestazione</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testo piè di pagina</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Logo abilitato</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Abilita la stampa del logo sullo scontrino
                      </div>
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

              {form.watch('logoEnabled') && (
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <FormLabel className="block mb-2">Logo</FormLabel>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                    </div>
                    {previewLogo && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Anteprima:</p>
                        <img
                          src={previewLogo}
                          alt="Logo preview"
                          className="max-w-[120px] border rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="logoWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Larghezza logo (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} max={120} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logoHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altezza logo (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} max={40} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  Salva configurazione
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}