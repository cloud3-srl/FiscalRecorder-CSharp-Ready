import React, { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import ColumnSelector, { ColumnConfig } from "@/components/DataTable/ColumnSelector";
import { Plus, Edit, Trash2, Copy, Search, Filter, MoreHorizontal, Download, ShoppingCart } from "lucide-react";
import { Product, Department, Category, insertProductSchema } from "@shared/schema";
import "@/styles/pos.css";

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

  // Configurazione colonne
  const defaultColumns: ColumnConfig[] = [
    { key: "code", label: "Codice", visible: true, sortable: true, width: 120, required: true },
    { key: "name", label: "Descrizione", visible: true, sortable: true, width: 250, required: true },
    { key: "price", label: "Prezzo", visible: true, sortable: true, width: 100 },
    { key: "vatRate", label: "IVA", visible: true, sortable: true, width: 80 },
    { key: "departmentCode", label: "Reparto", visible: true, sortable: true, width: 120 },
    { key: "category", label: "Categoria", visible: true, sortable: true, width: 120 },
    { key: "barcode", label: "Barcode", visible: false, sortable: true, width: 140 },
    { key: "unitOfMeasure", label: "U.M.", visible: false, sortable: true, width: 80 },
    { key: "inStock", label: "Giacenza", visible: true, sortable: true, width: 100 },
    { key: "description", label: "Desc. Estesa", visible: false, sortable: true, width: 200 },
    { key: "createdAt", label: "Creato", visible: false, sortable: true, width: 150 },
    { key: "updatedAt", label: "Modificato", visible: false, sortable: true, width: 150 },
  ];

  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const visibleColumns = columns.filter(col => col.visible);

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

  // Filtro prodotti
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDepartment = selectedDepartment === "all" || product.departmentCode === selectedDepartment;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      
      return matchesSearch && matchesDepartment && matchesCategory;
    });
  }, [products, searchTerm, selectedDepartment, selectedCategory]);

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
        isVariablePrice: false,
        isFavorite: false,
        trackInventory: product.isLotManaged || false,
        currentStock: product.inStock || 0,
        minStock: 0,
      });
    } else {
      setEditingProduct(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
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

  const formatFieldValue = (product: Product, field: string) => {
    const value = product[field as keyof Product];
    
    if (field === "price") {
      return `€${value}`;
    }
    
    if (field === "vatRate") {
      return `${value}%`;
    }
    
    if (field === "inStock") {
      return value ? `${value}` : '0';
    }
    
    if (field === "createdAt" || field === "updatedAt") {
      return value ? new Date(value as string | number | Date).toLocaleDateString() : '-';
    }
    
    return String(value || '-');
  };

  const handleExport = () => {
    const csvContent = [
      visibleColumns.map(col => col.label).join(','),
      ...filteredProducts.map(product => 
        visibleColumns.map(col => formatFieldValue(product, col.key)).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prodotti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fullscreen-form">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Prodotti</h1>
        </div>
        <p className="text-muted-foreground">
          Gestisci il catalogo prodotti con selezione colonne personalizzabile
        </p>
      </div>

      <Card className="fullscreen-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Catalogo Prodotti</CardTitle>
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
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca prodotti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 enhanced-input"
                />
              </div>
              <Badge variant="secondary">
                {filteredProducts.length} prodotti
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48 enhanced-input">
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
                <SelectTrigger className="w-48 enhanced-input">
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

              <ColumnSelector
                columns={columns}
                onColumnsChange={setColumns}
                tableId="products-table"
              />
              
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Esporta
              </Button>
            </div>
          </div>

          {/* Tabella prodotti */}
          <ScrollArea className="whitespace-nowrap rounded-md border" style={{ height: 'calc(100vh - 400px)' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.key} 
                      style={{ width: column.width }}
                      className="font-medium"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key} className="py-2">
                        {column.key === "departmentCode" && product.departmentCode ? (
                          <Badge variant="secondary">{product.departmentCode}</Badge>
                        ) : column.key === "category" && product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          formatFieldValue(product, column.key)
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplica
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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
                          <Input placeholder="Codice univoco" className="enhanced-input" {...field} />
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
                          <Input placeholder="Nome del prodotto" className="enhanced-input" {...field} />
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
                        <Textarea placeholder="Descrizione dettagliata" className="enhanced-input" value={field.value || ""} onChange={field.onChange} />
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
                            <SelectTrigger className="enhanced-input">
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
                            <SelectTrigger className="enhanced-input">
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
                            <SelectTrigger className="enhanced-input">
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
                          <Input type="number" step="0.01" placeholder="0.00" className="enhanced-input" {...field} />
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
                            <SelectTrigger className="enhanced-input">
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
                        <Input placeholder="8001234567890" className="enhanced-input" value={field.value || ""} onChange={field.onChange} />
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
                            <Input type="number" className="enhanced-input" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
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
                            <Input type="number" className="enhanced-input" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Pulsanti Dialog */}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvataggio..." : editingProduct ? "Salva Modifiche" : "Crea Prodotto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
