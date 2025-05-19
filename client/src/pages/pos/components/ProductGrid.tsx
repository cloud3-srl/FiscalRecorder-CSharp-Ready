import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Search, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  onSearchChange: (searchTerm: string) => void; // Nuova prop
}

export default function ProductGrid({ onProductSelect, onSearchChange }: ProductGridProps) {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const filteredProducts = search ? products?.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.code.toLowerCase().includes(search.toLowerCase())
  ) : [];

  if (isLoading) {
    return <div>Caricamento prodotti...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Incomincia a digitare Nome Articolo o spara il Codice a Barre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearchChange(e.target.value); // Notifica il cambiamento
          }}
          className="flex-1"
          autoFocus
        />
      </div>

      {search && filteredProducts && filteredProducts.length > 0 && (
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="w-[50px]">Cancella</TableHead> -- Rimosso come da screenshot POS */}
                <TableHead>Articolo #</TableHead>
                <TableHead>Nome Elemento</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Quantità</TableHead>
                {/* <TableHead>Imballo</TableHead> -- Rimosso come da screenshot POS */}
                {/* <TableHead className="text-right">Sconto %</TableHead> -- Rimosso come da screenshot POS */}
                {/* <TableHead className="text-right">Totale</TableHead> -- Rimosso come da screenshot POS */}
                {/* <TableHead className="w-[70px]">Aggiorna</TableHead> -- Rimosso come da screenshot POS */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow 
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    onProductSelect(product);
                    setSearch(""); 
                    onSearchChange(""); // Notifica che la ricerca è terminata
                  }}
                >
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">€{parseFloat(product.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{product.inStock || 0}</TableCell>
                  {/* Le colonne aggiuntive sono state commentate/rimosse per corrispondere allo screenshot, 
                      ma se servono possono essere ripristinate. 
                      Ad esempio, per l'icona "Cancella" o "Aggiorna" si potrebbe aggiungere:
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); console.log('delete', product.id);}}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell> 
                  */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {search && (!filteredProducts || filteredProducts.length === 0) && (
        <div className="text-center text-muted-foreground py-4">
          Nessun prodotto trovato
        </div>
      )}
    </div>
  );
}
