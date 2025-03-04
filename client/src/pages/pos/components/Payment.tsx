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
          total,
          paymentMethod: 'cash',
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete sale');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({
        title: "Sale completed",
        description: "Receipt is being printed"
      });
      onComplete();
      setCashReceived(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Payment</div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-bold">€{total.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cash received:</span>
          <span>€{cashReceived.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Change:</span>
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
        Complete Sale
      </Button>
    </div>
  );
}
