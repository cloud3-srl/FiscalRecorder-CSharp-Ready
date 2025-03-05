import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EuroIcon, CreditCard, QrCode } from "lucide-react";

interface PaymentProps {
  cart: Array<{product: Product, quantity: number}>;
  onComplete: () => void;
}

type PaymentMethod = 'contanti' | 'carte' | 'satispay';

export default function Payment({ cart, onComplete }: PaymentProps) {
  const [cashReceived, setCashReceived] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contanti');
  const { toast } = useToast();

  const total = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  );

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  const { mutate: completeSale, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: total.toFixed(2),
          paymentMethod,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: parseFloat(item.product.price.toString()).toFixed(2)
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Impossibile completare la vendita');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({
        title: "Vendita completata",
        description: "Stampa dello scontrino in corso"
      });
      onComplete();
      setCashReceived("");
      setPaymentMethod('contanti');
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
      <div className="text-lg font-semibold">Pagamento</div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Totale:</span>
          <span className="font-bold">€{total.toFixed(2)}</span>
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
          <>
            <div className="flex items-center gap-2">
              <span>Contanti ricevuti:</span>
              <Input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                className="w-24 text-right"
              />
            </div>

            <div className="flex justify-between">
              <span>Resto:</span>
              <span className="font-bold text-green-600">
                €{Math.max(0, change).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20, 50, 100].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setCashReceived(amount.toString())}
                  disabled={isPending}
                >
                  <EuroIcon className="mr-2 h-4 w-4" />
                  {amount}
                </Button>
              ))}
            </div>
          </>
        )}
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
        Completa Vendita
      </Button>
    </div>
  );
}