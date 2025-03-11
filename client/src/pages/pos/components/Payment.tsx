import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EuroIcon, CreditCard, QrCode } from "lucide-react";
import NumericKeypad from "./NumericKeypad";
import { useOfflineSync } from "@/hooks/use-offline";
import { savePendingSale } from "@/lib/indexedDB";

interface PaymentProps {
  cart: Array<{product: Product, quantity: number}>;
  onComplete: () => void;
}

type PaymentMethod = 'contanti' | 'carte' | 'satispay';
type InputFocus = 'total' | 'cash';

export default function Payment({ cart, onComplete }: PaymentProps) {
  const [cashReceived, setCashReceived] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contanti');
  const [manualTotal, setManualTotal] = useState<string>("");
  const [inputFocus, setInputFocus] = useState<InputFocus>('total');
  const { toast } = useToast();
  const { isOnline } = useOfflineSync();

  const subtotal = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  );

  // Calcola lo sconto basato sul totale manuale se presente
  const total = manualTotal ? parseFloat(manualTotal) : subtotal;
  const discountAmount = subtotal - total;

  // Calcolo IVA (22%)
  const vatAmount = total * 0.22;

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  const handleDiscount = (amount: number) => {
    const newTotal = subtotal - amount;
    if (newTotal >= 0) {
      setManualTotal(newTotal.toFixed(2));
    }
  };

  const handleKeypadInput = (value: string) => {
    if (inputFocus === 'total') {
      setManualTotal(value);
    } else {
      setCashReceived(value);
    }
  };

  const { mutate: completeSale, isPending } = useMutation({
    mutationFn: async () => {
      const saleData = {
        total: total.toFixed(2),
        paymentMethod,
        timestamp: new Date(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: parseFloat(item.product.price.toString()).toFixed(2)
        }))
      };

      if (!isOnline) {
        await savePendingSale(saleData, saleData.items);
        return { message: "Vendita salvata offline" };
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        throw new Error('Impossibile completare la vendita');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({
        title: isOnline ? "Vendita completata" : "Vendita salvata offline",
        description: isOnline 
          ? "Stampa dello scontrino in corso"
          : "La vendita verrà sincronizzata quando la connessione sarà ripristinata"
      });
      onComplete();
      setCashReceived("");
      setManualTotal("");
      setPaymentMethod('contanti');
      setInputFocus('total');
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile completare la vendita",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">
        Pagamento {!isOnline && "(Modalità Offline)"}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotale:</span>
          <span className="font-bold">€{subtotal.toFixed(2)}</span>
        </div>

        {/* Sezione Sconto */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Sconto:</span>
            <span>€{discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* IVA e Totale */}
        <div className="space-y-2 border-t pt-2">
          <div className="flex justify-between text-sm">
            <span>IVA (22%):</span>
            <span>€{vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Totale:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Metodi di pagamento */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={paymentMethod === 'contanti' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('contanti')}
          >
            <EuroIcon className="mr-2 h-4 w-4" />
            Contanti
          </Button>
          <Button
            variant={paymentMethod === 'carte' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('carte')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Carte
          </Button>
          <Button
            variant={paymentMethod === 'satispay' ? 'default' : 'outline'}
            onClick={() => setPaymentMethod('satispay')}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Satispay
          </Button>
        </div>

        {/* Input contanti e resto solo se il metodo è contanti */}
        {paymentMethod === 'contanti' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Contanti ricevuti:</span>
              <span>€{cashReceived || '0.00'}</span>
            </div>
            <Input
              type="text"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              onFocus={() => setInputFocus('cash')}
              className="w-full text-right text-2xl"
              placeholder="Contanti ricevuti"
            />
            <div className="flex justify-between font-medium">
              <span>Resto:</span>
              <span className="text-green-600">
                €{Math.max(0, change).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <NumericKeypad
          value={inputFocus === 'total' ? manualTotal : cashReceived}
          onChange={handleKeypadInput}
          onDiscount={handleDiscount}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={
          cart.length === 0 || 
          (paymentMethod === 'contanti' && cashReceivedNum < total) || 
          isPending
        }
        onClick={() => completeSale()}
      >
        {isOnline ? "Completa Vendita" : "Salva Vendita Offline"}
      </Button>
    </div>
  );
}