import React, { useState, useEffect } from "react";
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
import { Building2, Upload, X, Image, Database } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "@/styles/pos.css";

const companySchema = z.object({
  groupName: z.string().optional(),
  companyName: z.string().min(1, "Ragione sociale è obbligatoria"),
  logo: z.string().optional(),
  addressStreet: z.string().optional(),
  addressZip: z.string().optional(),
  addressCity: z.string().optional(),
  addressProvince: z.string().optional(),
  addressCountry: z.string().optional(),
  vatNumber: z.string().optional(),
  fiscalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanySettings() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      groupName: "",
      companyName: "",
      logo: "",
      addressStreet: "",
      addressZip: "",
      addressCity: "",
      addressProvince: "",
      addressCountry: "",
      vatNumber: "",
      fiscalCode: "",
      phone: "",
      email: "",
    },
  });

  // Query per caricare i dati esistenti
  const { data: companyProfile, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/company-profile');
      if (!response.ok) throw new Error('Errore nel caricamento del profilo');
      return response.json();
    }
  });

  // Mutation per salvare i dati
  const saveMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await fetch('/api/settings/company-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Errore HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni salvate",
        description: "Le informazioni aziendali sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['appLogoConfig'] });
    },
    onError: (error) => {
      console.error('Errore salvataggio:', error);
      toast({
        title: "Errore nel salvataggio",
        description: error instanceof Error ? error.message : "Impossibile salvare le impostazioni. Riprova.",
        variant: "destructive",
      });
    }
  });

  // Mutation per importare dati da DB remoto
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/import-company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Errore HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        form.reset(data);
        if (data.logo) {
          setLogoPreview(data.logo);
        }
        toast({
          title: "Dati importati",
          description: "I dati aziendali sono stati importati dal gestionale con successo.",
        });
        queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      }
    },
    onError: (error) => {
      console.error('Errore importazione:', error);
      toast({
        title: "Errore nell'importazione",
        description: error instanceof Error ? error.message : "Impossibile importare i dati. Verifica la connessione al database.",
        variant: "destructive",
      });
    }
  });

  // Popola il form quando i dati vengono caricati
  useEffect(() => {
    if (companyProfile && Object.keys(companyProfile).length > 0) {
      form.reset(companyProfile);
      if (companyProfile.logo) {
        setLogoPreview(companyProfile.logo);
      }
    }
  }, [companyProfile, form]);

  const onSubmit = (data: CompanyFormValues) => {
    saveMutation.mutate(data);
  };

  const handleImportData = () => {
    importMutation.mutate();
  };

  const handleFileUpload = (file: File) => {
    // Validazione tipo file
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato non supportato",
        description: "Sono accettati solo file SVG, PNG e JPG.",
        variant: "destructive",
      });
      return;
    }

    // Validazione dimensione ridotta per evitare problemi con base64
    const maxSize = 500 * 1024; // 500KB per evitare problemi con base64
    if (file.size > maxSize) {
      toast({
        title: "File troppo grande",
        description: "Il file deve essere inferiore a 500KB per garantire un salvataggio corretto.",
        variant: "destructive",
      });
      return;
    }

    // Per SVG, leggi come testo per evitare problemi
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Per SVG mantieni il testo originale
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(result)}`;
        setLogoPreview(svgDataUrl);
        form.setValue('logo', svgDataUrl);
        
        toast({
          title: "Logo SVG caricato",
          description: "Il logo aziendale SVG è stato caricato con successo.",
        });
      };
      reader.onerror = () => {
        toast({
          title: "Errore caricamento SVG",
          description: "Impossibile leggere il file SVG selezionato.",
          variant: "destructive",
        });
      };
      reader.readAsText(file);
    } else {
      // Per immagini raster, ridimensiona se necessario
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast({
            title: "Errore elaborazione immagine",
            description: "Impossibile elaborare l'immagine. Prova con un'altra immagine.",
            variant: "destructive",
          });
          return;
        }
        
        // Ridimensiona se l'immagine è troppo grande
        let { width, height } = img;
        const maxDimension = 400; // Dimensione massima
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converti in base64 con qualità ridotta per JPEG
        const quality = file.type === 'image/jpeg' ? 0.8 : undefined;
        const dataUrl = canvas.toDataURL(file.type, quality);
        
        // Verifica che il base64 risultante non sia troppo grande
        if (dataUrl.length > 1000000) { // ~750KB in base64
          toast({
            title: "Immagine troppo complessa",
            description: "L'immagine risulta troppo grande anche dopo la compressione. Prova con un'immagine più semplice.",
            variant: "destructive",
          });
          return;
        }
        
        setLogoPreview(dataUrl);
        form.setValue('logo', dataUrl);
        
        toast({
          title: "Logo caricato",
          description: width !== img.width || height !== img.height 
            ? `Logo ridimensionato (${Math.round(width)}×${Math.round(height)}) e caricato con successo.`
            : "Il logo aziendale è stato caricato con successo.",
        });
      };
      
      img.onerror = () => {
        toast({
          title: "Errore caricamento immagine",
          description: "Impossibile elaborare l'immagine selezionata.",
          variant: "destructive",
        });
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    form.setValue('logo', "");
    toast({
      title: "Logo rimosso",
      description: "Il logo aziendale è stato rimosso.",
    });
  };

  if (isLoading) {
    return (
      <div className="fullscreen-form">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Ragione sociale</h1>
            </div>
          </div>
        </div>
        <Card className="fullscreen-card">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Caricamento impostazioni...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fullscreen-form">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Ragione sociale</h1>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleImportData}
            disabled={importMutation.isPending}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            {importMutation.isPending ? "Importazione..." : "Importa Dati"}
          </Button>
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
                {/* COLONNA SINISTRA - Informazioni Azienda, Indirizzo e Logo */}
                <div className="form-section">
                  <h3 className="form-section-title">Informazioni Azienda</h3>
                  
                  {/* Gruppo */}
                  <FormField
                    control={form.control}
                    name="groupName"
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
                    name="companyName"
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
                    name="addressStreet"
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
                      name="addressZip"
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
                      name="addressCity"
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
                      name="addressProvince"
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
                      name="addressCountry"
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

                  {/* Logo Aziendale */}
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Logo Azienda</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Area di upload */}
                            <div
                              className={`
                                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                                ${logoPreview ? 'border-green-500 bg-green-50' : ''}
                              `}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <input
                                id="logo-upload"
                                type="file"
                                accept=".svg,.png,.jpg,.jpeg"
                                onChange={handleFileInputChange}
                                className="hidden"
                                aria-label="Upload logo aziendale"
                              />
                              
                              {logoPreview ? (
                                <div className="space-y-2">
                                  <div className="relative inline-block">
                                    <img
                                      src={logoPreview}
                                      alt="Logo preview"
                                      className="max-w-full max-h-32 object-contain"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeLogo();
                                      }}
                                      aria-label="Rimuovi logo"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-green-600 font-medium">Logo caricato con successo</p>
                                  <p className="text-xs text-gray-500">Clicca per sostituire</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Carica il logo aziendale
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Trascina un file qui o clicca per selezionare
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Informazioni formato */}
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center gap-2">
                                <Image className="h-3 w-3" />
                                <span>Formati supportati: SVG, PNG, JPG</span>
                              </div>
                              <div>📐 Dimensioni consigliate: 300×150px (rapporto 2:1)</div>
                              <div>💾 Dimensione massima: 2MB</div>
                              <div>✨ SVG preferito per qualità scalabile</div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* COLONNA DESTRA - Dati Fiscali e Contatti */}
                <div className="form-section">
                  <h3 className="form-section-title">Dati Fiscali</h3>
                  
                  <FormField
                    control={form.control}
                    name="vatNumber"
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
                    name="fiscalCode"
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
                    name="phone"
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
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Salvataggio..." : "Salva Impostazioni"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
