import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartProps {
  items: Array<{product: Product, quantity: number}>;
  setItems: (items: Array<{product: Product, quantity: number}>) => void;
}

export default function Cart({ items, setItems }: CartProps) {
  const updateQuantity = (productId: number, delta: number) => {
    setItems(
      items.map(item => 
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.product.id !== productId));
  };

  const total = items.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  );

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Carrello</div>

      <div className="space-y-2">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                €{product.price.toString()} x {quantity}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => updateQuantity(product.id, -1)}
                title="Diminuisci quantità"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-8 text-center">{quantity}</span>

              <Button
                size="icon"
                variant="outline"
                onClick={() => updateQuantity(product.id, 1)}
                title="Aumenta quantità"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="destructive"
                onClick={() => removeItem(product.id)}
                title="Rimuovi prodotto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xl font-bold text-right">
        Totale: €{total.toFixed(2)}
      </div>
    </div>
  );
}