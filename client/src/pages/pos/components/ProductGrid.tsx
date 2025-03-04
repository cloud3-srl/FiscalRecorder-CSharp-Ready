import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Grid, Search } from "lucide-react";
import { useState } from "react";

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
}

export default function ProductGrid({ onProductSelect }: ProductGridProps) {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.code.toLowerCase().includes(search.toLowerCase())
  );

  // Prendi solo i primi 8 prodotti dalla lista filtrata
  const displayedProducts = filteredProducts?.slice(0, 8);

  if (isLoading) {
    return <div>Caricamento prodotti...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cerca prodotti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid grid-rows-2 grid-cols-4 gap-2">
        {displayedProducts?.map(product => (
          <Button
            key={product.id}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center text-center p-2"
            onClick={() => onProductSelect(product)}
          >
            <Grid className="w-8 h-8 mb-1" />
            <div className="text-sm font-medium truncate w-full">
              {product.name}
            </div>
            <div className="text-xs text-muted-foreground">
              €{product.price.toString()}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}