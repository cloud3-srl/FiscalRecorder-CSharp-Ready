import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { EuroIcon, CreditCard, QrCode, Wallet, Receipt, Percent } from "lucide-react";
import NumericKeypad from "./NumericKeypad";

interface PaymentProps {
  cart: Array<{product: Product, quantity: number}>;
  customerId: number | null;
  onComplete: () => void;
}

type PaymentMethod = 'contanti' | 'carte' | 'satispay';
type InputFocus = 'total' | 'cash';

export default function Payment({ cart, customerId, onComplete }: PaymentProps) {
  const [cashReceived, setCashReceived] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contanti');
  const [manualTotal, setManualTotal] = useState<string>("");
  const [inputFocus, setInputFocus] = useState<InputFocus>('total');
  const { toast } = useToast();

  const subtotal = cart.reduce(
    (sum, item) => sum + (parseFloat(item.product.price) * item.quantity),
    0
  );

  // Calcola lo sconto basato sul totale manuale se presente
  const total = manualTotal ? parseFloat(manualTotal) : subtotal;
  const discountAmount = subtotal - total;
  const discountPercentage = subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;

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
        customerId,
        timestamp: new Date(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: parseFloat(item.product.price).toFixed(2)
        }))
      };

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
        title: "Vendita completata",
        description: "Stampa dello scontrino in corso"
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
      <div className="flex items-center mb-4 text-blue-600">
        <Wallet className="h-5 w-5 mr-2" />
        <div className="text-lg font-semibold">Pagamento</div>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 font-medium">Subtotale:</span>
            <span className="font-bold">€{subtotal.toFixed(2)}</span>
          </div>

          {/* Sezione Sconto */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center text-green-600">
                <Percent className="h-4 w-4 mr-1" />
                <span>Sconto ({discountPercentage}%):</span>
              </div>
              <span className="text-green-600 font-medium">-€{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* IVA e Totale */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">IVA (22%):</span>
              <span className="text-gray-600">€{vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-700">Totale:</span>
              <span className="text-lg font-bold text-blue-600">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Metodi di pagamento */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            variant="outline"
            className={`flex items-center justify-center py-6 ${
              paymentMethod === 'contanti' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
            onClick={() => setPaymentMethod('contanti')}
          >
            <div className="flex flex-col items-center">
              <EuroIcon className="mb-1 h-5 w-5" />
              <span className="text-sm">Contanti</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className={`flex items-center justify-center py-6 ${
              paymentMethod === 'carte' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
            onClick={() => setPaymentMethod('carte')}
          >
            <div className="flex flex-col items-center">
              <CreditCard className="mb-1 h-5 w-5" />
              <span className="text-sm">Carte</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className={`flex items-center justify-center py-6 ${
              paymentMethod === 'satispay' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
            onClick={() => setPaymentMethod('satispay')}
          >
            <div className="flex flex-col items-center">
              <QrCode className="mb-1 h-5 w-5" />
              <span className="text-sm">Satispay</span>
            </div>
          </Button>
        </div>

        {/* Input contanti e resto solo se il metodo è contanti */}
        {paymentMethod === 'contanti' && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-gray-700">
                <EuroIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Contanti ricevuti:</span>
              </div>
              <span className="font-medium">€{cashReceived || '0.00'}</span>
            </div>
            <Input
              type="text"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              onFocus={() => setInputFocus('cash')}
              className="w-full text-right text-2xl bg-white border-gray-200"
              placeholder="Contanti ricevuti"
            />
            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center">
                <Receipt className="h-4 w-4 mr-1 text-green-600" />
                <span className="font-medium">Resto:</span>
              </div>
              <span className="text-green-600 font-bold">
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
        className="w-full py-6 mt-4 bg-blue-600 hover:bg-blue-700"
        size="lg"
        disabled={
          cart.length === 0 || 
          (paymentMethod === 'contanti' && cashReceivedNum < total) || 
          isPending
        }
        onClick={() => completeSale()}
      >
        {isPending ? "Elaborazione..." : "Completa Vendita"}
      </Button>
    </div>
  );
}
