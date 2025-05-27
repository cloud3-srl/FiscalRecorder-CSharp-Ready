import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, Save, Users, Store, RotateCcw, FileX } from "lucide-react";
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
    <div className="flex flex-col h-full">
      {/* Totale con effetto vetro azzurro - ridotto */}
      <div className="relative mb-4">
        <div className="glass-effect-blue rounded-lg p-4 border-2 border-blue-200 shadow-lg">
          <div className="pulse-blue-border absolute inset-0 rounded-lg border-2 border-blue-400 opacity-50"></div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Totale</span>
            <span className="text-2xl font-bold text-blue-600">€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Spazio per cliente selezionato */}
      <div className="h-4 mb-2"></div>

      {/* Lista articoli con effetto scontrino */}
      <div className="flex-grow relative">
        <div className="overflow-y-auto h-full bg-white rounded border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">Descrizione</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center w-[100px]">Qtà</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Prezzo</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right w-[40px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    Il carrello è vuoto.
                  </TableCell>
                </TableRow>
              )}
              {items.map(({ product, quantity }) => (
                <TableRow key={product.id} className="hover:bg-blue-50 transition-colors">
                  <TableCell className="max-w-[150px] truncate text-sm">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="outline" className="h-6 w-6 bg-gray-50 hover:bg-gray-100 border-gray-200" onClick={() => updateQuantity(product.id, -1)}>
                        <Minus className="h-3 w-3 text-gray-600" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6 bg-gray-50 hover:bg-gray-100 border-gray-200" onClick={() => updateQuantity(product.id, 1)}>
                        <Plus className="h-3 w-3 text-gray-600" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    €{parseFloat(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-100" onClick={() => removeItem(product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Tratteggio scontrino in basso */}
        <div className="receipt-bottom-border mt-4"></div>
      </div>
    </div>
  );
}
