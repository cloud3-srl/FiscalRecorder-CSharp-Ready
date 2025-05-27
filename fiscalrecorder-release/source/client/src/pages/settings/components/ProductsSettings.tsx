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
import { Plus, Edit, Trash2, Copy, Search, Filter } from "lucide-react";
import { Product, Department, Category, insertProductSchema } from "@shared/schema";

// Schema per il form prodotto esteso
const productFormSchema = insertProductSchema.extend({
  id: z.number().optional(),
  departmentId: z.number().optional(),
  categoryId: z.number().optional(),
  isVariablePrice: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  trackInventory: z.boolean().default(false),
  currentStock: z.number().optional(),
  minStock: z.number().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Errore nel caricamento prodotti');
      return response.json();
    }
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Errore nel caricamento reparti');
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Errore nel caricamento categorie');
      return response.json();
    }
  });

  // Form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      barcode: "",
      price: "0.00",
      vatRate: "22.00",
      unitOfMeasure: "PZ",
      isVariablePrice: false,
      isFavorite: false,
      trackInventory: false,
      currentStock: 0,
      minStock: 0,
    },
  });

  // Mutations
  const { mutate: saveProduct, isPending: isSaving } = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const { id, departmentId, categoryId, isVariablePrice, isFavorite, trackInventory, currentStock, minStock, ...productData } = data;
      
      const url = id ? `/api/products/${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          departmentCode: departmentId ? departments.find(d => d.id === departmentId)?.description : undefined,
          category: categoryId ? categories.find(c => c.id === categoryId)?.name : undefined,
          inStock: trackInventory ? currentStock || 0 : 0,
        }),
      });
      
      if (!response.ok) throw new Error('Errore nel salvataggio prodotto');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prodotto salvato",
        description: "Il prodotto è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsDialogOpen(false);
      setEditingProduct(null);
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

  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Errore nell\'eliminazione prodotto');
    },
    onSuccess: () => {
      toast({
        title: "Prodotto eliminato",
        description: "Il prodotto è stato eliminato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const department = departments.find(d => d.description === product.departmentCode);
      const category = categories.find(c => c.name === product.category);
      
      form.reset({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        price: product.price.toString(),
        vatRate: product.vatRate?.toString() || "22.00",
        unitOfMeasure: product.unitOfMeasure || "PZ",
        departmentId: department?.id,
        categoryId: category?.id,
        isVariablePrice: false, // Da implementare nel DB
        isFavorite: false, // Da implementare nel DB
        trackInventory: product.isLotManaged || false,
        currentStock: product.inStock || 0,
        minStock: 0, // Da implementare nel DB
      });
    } else {
      setEditingProduct(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    // Create a new product form data for duplication
    const department = departments.find(d => d.description === product.departmentCode);
    const category = categories.find(c => c.name === product.category);
    
    setEditingProduct(null);
    form.reset({
      code: `${product.code}_COPY`,
      name: `${product.name} (Copia)`,
      description: product.description || "",
      barcode: product.barcode || "",
      price: product.price.toString(),
      vatRate: product.vatRate?.toString() || "22.00",
      unitOfMeasure: product.unitOfMeasure || "PZ",
      departmentId: department?.id,
      categoryId: category?.id,
      isVariablePrice: false,
      isFavorite: false,
      trackInventory: product.isLotManaged || false,
      currentStock: product.inStock || 0,
      minStock: 0,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      deleteProduct(id);
    }
  };

  // Filtro prodotti
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || product.departmentCode === selectedDepartment;
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    return matchesSearch && matchesDepartment && matchesCategory;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Prodotti</h1>
        <p className="text-muted-foreground">
          Gestisci il catalogo prodotti
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista Prodotti</CardTitle>
              <CardDescription>
                Configura i prodotti del tuo catalogo
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Nuovo Prodotto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtri */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o codice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtra per reparto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i reparti</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.description}>
                    {dept.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtra per categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabella prodotti */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Reparto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>€{product.price}</TableCell>
                    <TableCell>{product.vatRate}%</TableCell>
                    <TableCell>
                      {product.departmentCode && (
                        <Badge variant="secondary">{product.departmentCode}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="outline">{product.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateProduct(product)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedDepartment !== "all" || selectedCategory !== "all" 
                ? "Nessun prodotto corrisponde ai filtri selezionati" 
                : "Nessun prodotto nel catalogo"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuovo/Modifica Prodotto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifica Prodotto" : "Nuovo Prodotto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica i dati del prodotto" : "Inserisci i dati del nuovo prodotto"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveProduct(data))} className="space-y-6">
              {/* Sezione Dati Principali */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dati Principali</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Prodotto (SKU/PLU)</FormLabel>
                        <FormControl>
                          <Input placeholder="Codice univoco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione Breve *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome del prodotto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione Estesa</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrizione dettagliata" value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reparto *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona reparto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.description}
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
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
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
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aliquota IVA *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "22"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="IVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="4">4%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="22">22%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sezione Prezzi */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Prezzi</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prezzo di Vendita *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isVariablePrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Prezzo Variabile</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Permetti variazione prezzo in cassa
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitOfMeasure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unità di Misura</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "PZ"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="UM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PZ">Pezzo</SelectItem>
                            <SelectItem value="KG">Chilogrammo</SelectItem>
                            <SelectItem value="LT">Litro</SelectItem>
                            <SelectItem value="MT">Metro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sezione Codici */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Codici</h3>
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice a Barre (EAN)</FormLabel>
                      <FormControl>
                        <Input placeholder="8001234567890" value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sezione Magazzino */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Magazzino</h3>
                
                <FormField
                  control={form.control}
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Traccia Magazzino</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Abilita gestione delle scorte
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("trackInventory") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giacenza Attuale</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scorta Minima</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Sezione Altro */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Altro</h3>
                
                <FormField
                  control={form.control}
                  name="isFavorite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Prodotto Preferito</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mostra nei pulsanti rapidi
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvataggio..." : "Salva"}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    saveProduct(form.getValues());
                    form.reset();
                  }}
                  disabled={isSaving}
                >
                  Salva e Aggiungi Nuovo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
