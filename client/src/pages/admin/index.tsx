import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Download, Trash2, Database, RefreshCw, Edit, Search, Printer } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";

// Tipi TypeScript
interface Stats {
  totalProducts: number;
  lastSync: string;
  cacheStatus: 'valid' | 'invalid';
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  unitOfMeasure?: string;
}

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorLogId, setErrorLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  // Query per ottenere le statistiche
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['/api/admin/stats'],
  });

  // Query per ottenere i prodotti
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Mutation per aggiornare un prodotto
  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Product) => {
      const response = await fetch(`/api/products/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile aggiornare il prodotto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Prodotto aggiornato",
        description: "Le modifiche sono state salvate con successo"
      });
      setEditingProduct(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il prodotto",
        variant: "destructive"
      });
    }
  });

  // Mutation per svuotare l'archivio
  const { mutate: clearArchive, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/clear-products', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Impossibile svuotare l\'archivio');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Archivio svuotato",
        description: "Tutti gli articoli sono stati rimossi"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile svuotare l'archivio",
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const response = await fetch('/api/admin/import-products', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'importazione');
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        setErrorLogId(data.errorLogId);
        toast({
          title: "Importazione completata con errori",
          description: `Importati ${data.imported} prodotti su ${data.total}. ${data.errors.length} errori riscontrati.`,
          variant: "destructive"
        });
      } else {
        setErrorLogId(null);
        toast({
          title: "Importazione completata",
          description: `Importati ${data.imported} prodotti con successo`
        });
      }

      setFile(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile importare i prodotti",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (errorLogId) {
      window.location.href = `/api/admin/import-errors/${errorLogId}`;
    }
  };

  const handleClearArchive = () => {
    if (window.confirm('Sei sicuro di voler svuotare l\'archivio? Questa azione è irreversibile.')) {
      clearArchive();
    }
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      updateProduct(editingProduct);
    }
  };

  // Filtra i prodotti in base al termine di ricerca
  const filteredProducts = products?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Amministrazione</h1>
          <div className="flex gap-2">
            <Link href="/admin/database">
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Configura Database
              </Button>
            </Link>
            <Link href="/report">
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Configura Stampante
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Totale Articoli</div>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalProducts || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Ultima Sincronizzazione</div>
            <div className="text-sm font-medium">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.lastSync || 'Mai'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Stato Cache</div>
            <div className="text-sm font-medium flex items-center gap-2">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className={`h-2 w-2 rounded-full ${stats?.cacheStatus === 'valid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {stats?.cacheStatus === 'valid' ? 'Aggiornata' : 'Da aggiornare'}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Gestione Archivio */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Gestione Archivio</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearArchive}
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Svuota Archivio
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importa
              </Button>
            </div>

            {errorLogId && (
              <Button
                variant="outline"
                onClick={handleDownloadErrors}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica log errori
              </Button>
            )}

            <div className="text-sm text-muted-foreground">
              Il file CSV deve contenere le seguenti colonne:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ARCODART (Codice articolo - obbligatorio)</li>
                <li>ARDESART (Descrizione articolo - obbligatorio)</li>
                <li>LIPREZZO (Prezzo - obbligatorio)</li>
                <li>LICODLIS (Codice listino)</li>
                <li>LIDATATT (Data attivazione - formato YYYY-MM-DD)</li>
                <li>LIDATDIS (Data disattivazione - formato YYYY-MM-DD)</li>
                <li>LIUNIMIS (Unità di misura)</li>
                <li>cpccchk (Flag di controllo)</li>
                <li>LISCONT1 (Primo sconto)</li>
                <li>LISCONT2 (Secondo sconto)</li>
                <li>LISCONT3 (Terzo sconto)</li>
                <li>LISCONT4 (Quarto sconto)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Lista Articoli */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Articoli</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cerca articoli..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts?.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>€{product.price.toString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {/* Form di modifica */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Articolo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Codice</label>
                  <Input
                    value={editingProduct?.code || ''}
                    onChange={(e) => setEditingProduct({...editingProduct!, code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prezzo</label>
                  <Input
                    type="number"
                    value={editingProduct?.price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct!, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrizione</label>
                <Input
                  value={editingProduct?.name || ''}
                  onChange={(e) => setEditingProduct({...editingProduct!, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unità di misura</label>
                <Input
                  value={editingProduct?.unitOfMeasure || ''}
                  onChange={(e) => setEditingProduct({...editingProduct!, unitOfMeasure: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  Annulla
                </Button>
                <Button onClick={handleSaveProduct} disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salva
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
