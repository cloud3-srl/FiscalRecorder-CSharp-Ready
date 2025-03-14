import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    (sum, item) => sum + (parseFloat(item.product.price) * item.quantity),
    0
  );

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Carrello</div>

      <div className="overflow-auto max-h-[calc(100vh-400px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Prezzo</TableHead>
              <TableHead className="text-right">Qtà</TableHead>
              <TableHead className="text-right">Subtot.</TableHead>
              <TableHead className="w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ product, quantity }) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono">{product.code}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {product.name}
                </TableCell>
                <TableCell className="text-right">
                  €{parseFloat(product.price).toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  €{(parseFloat(product.price) * quantity).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => removeItem(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totale */}
      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Totale</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}