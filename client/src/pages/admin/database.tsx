import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react";
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
import { insertDatabaseConfigSchema } from "@shared/schema";

export default function DatabaseConfigPage() {
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);

  // Query per ottenere le configurazioni
  const { data: configs, isLoading } = useQuery({
    queryKey: ['/api/admin/database-configs'],
  });

  const form = useForm({
    resolver: zodResolver(insertDatabaseConfigSchema),
    defaultValues: {
      name: "",
      driver: "SQL Server Native Client 11.0",
      server: "",
      database: "",
      username: "",
      password: "",
      options: {},
      isActive: false
    }
  });

  // Mutation per salvare la configurazione
  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/database-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile salvare la configurazione');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-configs'] });
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni del database sono state aggiornate"
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione",
        variant: "destructive"
      });
    }
  });

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.getValues())
      });
      
      if (!response.ok) throw new Error('Test connessione fallito');
      
      toast({
        title: "Connessione riuscita",
        description: "Il database è raggiungibile"
      });
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Impossibile connettersi al database",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
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
        <h1 className="text-2xl font-bold mb-6">Configurazione Database</h1>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveConfig(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome configurazione</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="es. Database principale" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="es. localhost" />
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
                      <FormLabel>Database</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="es. AHR_POG" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Testa connessione
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salva configurazione
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {configs?.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configurazioni salvate</h2>
            <div className="space-y-4">
              {configs.map((config: any) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div>
                    <div className="font-medium">{config.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {config.server} / {config.database}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
