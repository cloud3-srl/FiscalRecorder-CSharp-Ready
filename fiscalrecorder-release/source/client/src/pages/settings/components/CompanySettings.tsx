import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/form";

const companySchema = z.object({
  gruppo: z.string().optional(),
  ragioneSociale: z.string().min(1, "Ragione sociale è obbligatoria"),
  via: z.string().optional(),
  cap: z.string().optional(),
  citta: z.string().optional(),
  provincia: z.string().optional(),
  stato: z.string().optional(),
  partitaIva: z.string().optional(),
  codiceFiscale: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanySettings() {
  const { toast } = useToast();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      gruppo: "",
      ragioneSociale: "",
      via: "",
      cap: "",
      citta: "",
      provincia: "",
      stato: "",
      partitaIva: "",
      codiceFiscale: "",
      telefono: "",
      email: "",
    },
  });

  const onSubmit = (data: CompanyFormValues) => {
    console.log("Saving company data:", data);
    toast({
      title: "Impostazioni salvate",
      description: "Le informazioni aziendali sono state aggiornate con successo.",
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ragione sociale</h1>
        <p className="text-muted-foreground">
          Configura le informazioni della tua azienda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Azienda</CardTitle>
          <CardDescription>
            Inserisci i dati della tua azienda che verranno utilizzati nei documenti fiscali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Gruppo */}
              <FormField
                control={form.control}
                name="gruppo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gruppo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome del gruppo aziendale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ragione sociale */}
              <FormField
                control={form.control}
                name="ragioneSociale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ragione sociale *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ragione sociale dell'azienda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sezione Indirizzo */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Indirizzo</h3>
                
                <FormField
                  control={form.control}
                  name="via"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Via</FormLabel>
                      <FormControl>
                        <Input placeholder="Via, Numero civico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gruppo campi affiancati */}
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAP</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="citta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Città</FormLabel>
                        <FormControl>
                          <Input placeholder="Città" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prov.</FormLabel>
                        <FormControl>
                          <Input placeholder="XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stato</FormLabel>
                        <FormControl>
                          <Input placeholder="Italia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dati fiscali */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dati Fiscali</h3>
                
                <FormField
                  control={form.control}
                  name="partitaIva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678901" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codiceFiscale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input placeholder="ABCDEF12G34H567I" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contatti */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contatti</h3>
                
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="info@azienda.it" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pulsante Salva */}
              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Salva
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
