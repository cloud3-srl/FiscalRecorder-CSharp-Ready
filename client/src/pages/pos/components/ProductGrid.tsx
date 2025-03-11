import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
            className="h-16 flex flex-col items-start justify-between p-2 text-left"
            onClick={() => onProductSelect(product)}
          >
            <div className="w-full">
              <div className="text-[10px] font-medium text-muted-foreground">
                {product.code}
              </div>
              <div className="text-[8px] leading-tight line-clamp-2">
                {product.name}
              </div>
            </div>
            <div className="text-xs font-semibold">
              €{product.price.toString()}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}