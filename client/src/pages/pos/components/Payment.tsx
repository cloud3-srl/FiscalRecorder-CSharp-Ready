import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EuroIcon } from "lucide-react";

interface PaymentProps {
  cart: Array<{product: Product, quantity: number}>;
  onComplete: () => void;
}

export default function Payment({ cart, onComplete }: PaymentProps) {
  const [cashReceived, setCashReceived] = useState(0);
  const { toast } = useToast();

  const total = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  );

  const change = cashReceived - total;

  const { mutate: completeSale, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: total.toFixed(2),
          paymentMethod: 'contanti',
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
      setCashReceived(0);
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

        <div className="flex justify-between">
          <span>Contanti ricevuti:</span>
          <span>€{cashReceived.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Resto:</span>
          <span className="font-bold text-green-600">
            €{Math.max(0, change).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[5, 10, 20, 50, 100].map(amount => (
          <Button
            key={amount}
            variant="outline"
            onClick={() => setCashReceived(amount)}
            disabled={isPending}
          >
            <EuroIcon className="mr-2 h-4 w-4" />
            {amount}
          </Button>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={cart.length === 0 || cashReceived < total || isPending}
        onClick={() => completeSale()}
      >
        Completa Vendita
      </Button>
    </div>
  );
}