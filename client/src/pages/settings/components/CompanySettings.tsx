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
import { Building2 } from "lucide-react";
import "@/styles/pos.css";

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
    <div className="fullscreen-form">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Ragione sociale</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Configura le informazioni della tua azienda
        </p>
      </div>

      <Card className="fullscreen-card">
        <CardHeader>
          <CardTitle>Informazioni Azienda</CardTitle>
          <CardDescription style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Inserisci i dati della tua azienda che verranno utilizzati nei documenti fiscali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="form-two-columns">
                {/* COLONNA SINISTRA - Informazioni Azienda e Indirizzo */}
                <div className="form-section">
                  <h3 className="form-section-title">Informazioni Azienda</h3>
                  
                  {/* Gruppo */}
                  <FormField
                    control={form.control}
                    name="gruppo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gruppo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome del gruppo aziendale" 
                            className="enhanced-input"
                            {...field} 
                          />
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
                          <Input 
                            placeholder="Ragione sociale dell'azienda" 
                            className="enhanced-input"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <h3 className="form-section-title mt-6">Indirizzo</h3>
                  
                  <FormField
                    control={form.control}
                    name="via"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Via</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Via, Numero civico" 
                            className="enhanced-input"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gruppo campi indirizzo compatti */}
                  <div className="input-group-compact">
                    <FormField
                      control={form.control}
                      name="cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAP</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="12345" 
                              className="enhanced-input"
                              {...field} 
                            />
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
                            <Input 
                              placeholder="Città" 
                              className="enhanced-input"
                              {...field} 
                            />
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
                            <Input 
                              placeholder="XX" 
                              className="enhanced-input"
                              {...field} 
                            />
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
                            <Input 
                              placeholder="Italia" 
                              className="enhanced-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* COLONNA DESTRA - Dati Fiscali e Contatti */}
                <div className="form-section">
                  <h3 className="form-section-title">Dati Fiscali</h3>
                  
                  <FormField
                    control={form.control}
                    name="partitaIva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partita IVA</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345678901" 
                            className="enhanced-input"
                            {...field} 
                          />
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
                          <Input 
                            placeholder="ABCDEF12G34H567I" 
                            className="enhanced-input"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <h3 className="form-section-title mt-6">Contatti</h3>
                  
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+39 123 456 7890" 
                            className="enhanced-input"
                            {...field} 
                          />
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
                          <Input 
                            placeholder="info@azienda.it" 
                            type="email" 
                            className="enhanced-input"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pulsante Salva */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button type="submit" size="lg" className="px-8">
                  Salva Impostazioni
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
