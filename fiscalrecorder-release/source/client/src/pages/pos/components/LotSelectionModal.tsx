import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Aggiunto import per Label
import { Product, ProductLot } from "@shared/schema"; // Assumendo che ProductLot sia definito in schema
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LotSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onLotSelect: (product: Product, selectedLot: ProductLot, quantity: number) => void;
}

async function fetchAvailableLots(productId: number): Promise<ProductLot[]> {
  if (!productId) return [];
  const response = await fetch(`/api/pos/products/${productId}/lots`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(errorData.error || `Errore nel recupero dei lotti: ${response.status}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
}

export default function LotSelectionModal({ isOpen, onOpenChange, product, onLotSelect }: LotSelectionModalProps) {
  const { toast } = useToast();
  const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const { data: availableLots = [], isLoading, error, refetch } = useQuery<ProductLot[], Error>({
    queryKey: ['availableLots', product?.id],
    queryFn: () => product ? fetchAvailableLots(product.id) : Promise.resolve([]),
    enabled: !!product && isOpen, // Esegui solo se il modale è aperto e c'è un prodotto
  });

  useEffect(() => {
    if (isOpen && product) {
      refetch(); // Riesegui la query quando il modale si apre o il prodotto cambia
      setSelectedLot(null); // Resetta il lotto selezionato
      setQuantity(1); // Resetta la quantità
    }
  }, [isOpen, product, refetch]);

  const handleSelect = () => {
    if (!product) {
      toast({ title: "Errore", description: "Nessun prodotto specificato.", variant: "destructive" });
      return;
    }
    if (!selectedLot) {
      toast({ title: "Selezione Mancante", description: "Seleziona un lotto.", variant: "destructive" });
      return;
    }
    if (quantity <= 0) {
      toast({ title: "Quantità Non Valida", description: "La quantità deve essere maggiore di zero.", variant: "destructive" });
      return;
    }
    if (quantity > parseFloat(selectedLot.quantityAvailable || "0")) {
      toast({ title: "Quantità Eccessiva", description: `Quantità disponibile per il lotto ${selectedLot.lotNumber}: ${selectedLot.quantityAvailable}`, variant: "destructive" });
      return;
    }
    onLotSelect(product, selectedLot, quantity);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleziona Lotto per: {product.name}</DialogTitle>
          <DialogDescription>
            Scegli un lotto e specifica la quantità per il prodotto {product.code}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && <div className="flex justify-center items-center p-4"><Loader2 className="h-8 w-8 animate-spin" /> Caricamento lotti...</div>}
        {error && <div className="text-red-500 p-4">Errore nel caricamento dei lotti: {error.message}</div>}
        
        {!isLoading && !error && availableLots.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">Nessun lotto disponibile per questo prodotto nel magazzino corrente.</div>
        )}

        {!isLoading && !error && availableLots.length > 0 && (
          <div className="max-h-60 overflow-y-auto my-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lotto #</TableHead>
                  <TableHead>Quantità Disp.</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Entrata</TableHead>
                  <TableHead>Seleziona</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableLots.map((lot) => (
                  <TableRow 
                    key={lot.id} 
                    onClick={() => setSelectedLot(lot)}
                    className={`cursor-pointer ${selectedLot?.id === lot.id ? 'bg-muted' : ''}`}
                  >
                    <TableCell>{lot.lotNumber}</TableCell>
                    <TableCell>{lot.quantityAvailable}</TableCell>
                    <TableCell>{lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{lot.entryDate ? new Date(lot.entryDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button 
                        variant={selectedLot?.id === lot.id ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSelectedLot(lot)}
                      >
                        {selectedLot?.id === lot.id ? "Selezionato" : "Seleziona"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedLot && (
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label htmlFor="quantity">Quantità per Lotto {selectedLot.lotNumber}:</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
              min="1"
              max={selectedLot.quantityAvailable || "1"} // Imposta max alla quantità disponibile del lotto
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSelect} disabled={!selectedLot || isLoading || availableLots.length === 0}>Conferma Selezione</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
