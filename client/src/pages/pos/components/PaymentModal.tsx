import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Sposto l'interfaccia qui
interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  cartItems: Array<{product: Product, quantity: number}>; // Per eventuale stampa
  onPaymentComplete: (paymentDetails: any) => void; // Dettagli del pagamento
}

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product } from "@shared/schema";
import { useState } from "react"; // Aggiunto useState
import CashInputKeypad from "./CashInputKeypad"; // Importa il nuovo componente
import { 
  CreditCard, Landmark, Ticket, Gift, Wallet, CalendarOff, 
  University, TrendingUp, TrendingDown, Contact, Building, FileText, Minus, Plus 
} from "lucide-react"; // Alcune icone esempio

// Esempio di metodi di pagamento
const paymentMethods = [
  { name: "CONTANTI", icon: Wallet, amountField: true, id: "cash" },
  { name: "BANCOMAT", icon: CreditCard, id: "bancomat" },
  { name: "CARTA DI CREDITO", icon: CreditCard, id: "credit_card" },
  { name: "ASSEGNO", icon: FileText, id: "check" },
  { name: "TICKET", icon: Ticket, id: "ticket" },
  { name: "BUONO PER SERVIZI", icon: Gift, id: "service_voucher" },
  { name: "BUONO PER BENI", icon: Gift, id: "goods_voucher" },
  { name: "PREPAGATA", icon: CreditCard, id: "prepaid_card" },
  // { name: "TS WALLET", icon: Wallet, id: "ts_wallet" }, // Rimosso come da screenshot
  { name: "DIFFERITO", icon: CalendarOff, id: "deferred" },
  { name: "BONIFICO BANCARIO", icon: Landmark, id: "bank_transfer" },
  { name: "RIBA 30", icon: TrendingUp, id: "riba_30" }, 
  { name: "RIBA 60", icon: TrendingDown, id: "riba_60" }, 
  { name: "POSTE PAY", icon: CreditCard, id: "poste_pay" }, 
  { name: "SATISPAY", icon: Wallet, id: "satispay" }, // Modificato da PAYPAL e icona Wallet per ora
];

export default function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  // cartItems, 
  onPaymentComplete,
}: PaymentModalProps) {
  const [cashReceivedAmount, setCashReceivedAmount] = useState(0);
  const [isCashKeypadOpen, setIsCashKeypadOpen] = useState(false);
  
  // Calcolo del resto: se cashReceivedAmount è maggiore di 0, il resto è cashReceivedAmount - totalAmount, altrimenti 0
  // Questo è semplificato, una logica completa gestirebbe pagamenti multipli e misti.
  const rest = cashReceivedAmount > 0 ? Math.max(0, cashReceivedAmount - totalAmount) : 0;
  const amountDue = Math.max(0, totalAmount - cashReceivedAmount); // Importo ancora dovuto

  const handleCashPaymentSubmit = (amount: number) => {
    setCashReceivedAmount(amount);
    // Qui si potrebbe aggiungere logica per pagamenti parziali o multipli
  };

  const handlePrint = () => {
    // Logica per la stampa/completamento pagamento
    console.log("Pagamento completato/Stampa richiesta");
    onPaymentComplete({ method: "CONTANTI", amount: totalAmount }); // Esempio
    onOpenChange(false); // Chiudi modale
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header fisso del modale */}
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Elaborazione Pagamento</DialogTitle>
        </DialogHeader>

        {/* Corpo del modale (scrollabile se necessario, ma le colonne interne gestiranno lo scroll) */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Colonna Sinistra: Metodi di Pagamento */}
          <div className="flex flex-col border-r bg-slate-50">
            <div className="p-4 border-b">
              <div className="flex justify-between text-2xl font-bold mb-2">
                <span>TOTALE</span>
                <span>€{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl text-green-600 font-semibold">
                <span>RESTO</span>
                <span>€{rest.toFixed(2)}</span>
              </div>
            </div>
            <ScrollArea className="flex-grow p-2">
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  if (method.id === "cash") {
                    return (
                      <CashInputKeypad
                        key={method.id}
                        open={isCashKeypadOpen}
                        onOpenChange={setIsCashKeypadOpen}
                        onSubmit={handleCashPaymentSubmit}
                        triggerElement={
                          <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center w-full">
                            <method.icon className="h-6 w-6 mb-1" />
                            <span className="text-xs leading-tight">{method.name}</span>
                            {method.amountField && <span className="text-blue-600 font-semibold text-sm mt-1">€{cashReceivedAmount.toFixed(2)}</span>}
                          </Button>
                        }
                      />
                    );
                  }
                  return (
                    <Button key={method.id} variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                      <method.icon className="h-6 w-6 mb-1" />
                      <span className="text-xs leading-tight">{method.name}</span>
                      {/* Per altri metodi con amountField, si dovrà gestire lo stato separatamente */}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
             <div className="p-4 border-t mt-auto"> {/* Spostato il display dell'importo dovuto qui */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Importo Dovuto:</span>
                <span className={amountDue > 0 ? "text-red-600" : "text-green-600"}>€{amountDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Dettagli Documento */}
          <div className="flex flex-col p-4 overflow-hidden">
            <Tabs defaultValue="scontrino" className="flex flex-col flex-grow overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="scontrino">SCONTRINO</TabsTrigger>
                <TabsTrigger value="fattura">FATTURA</TabsTrigger>
                <TabsTrigger value="conto">CONTO</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scontrino" className="flex-grow overflow-y-auto space-y-4 pt-4">
                <div>
                  <Label htmlFor="customer">Cliente</Label>
                  <div className="flex items-center gap-2">
                    <Input id="customer" placeholder="Seleziona cliente..." />
                    <Button variant="outline" size="icon"><Contact className="h-4 w-4" /></Button>
                  </div>
                </div>
                {/* Campo Azienda rimosso */}
                <div>
                  <Label htmlFor="causal">Causale</Label>
                  <Input id="causal" placeholder="Inserisci causale..." /> {/* Potrebbe essere un Select */}
                </div>
                <Separator />
                <div>
                  <Label>Scontrino parlante</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input placeholder="Codice Fiscale" />
                    <Input placeholder="Partita IVA" />
                  </div>
                </div>
                <div>
                  <Label>Scontrini di cortesia</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex-grow p-2 border rounded-md bg-muted text-sm">Nessuno</span>
                    <Button variant="outline" size="icon"><Minus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fattura" className="flex-grow overflow-y-auto pt-4">
                Dettagli per la Fattura (da implementare).
              </TabsContent>
              <TabsContent value="conto" className="flex-grow overflow-y-auto pt-4">
                Dettagli per il Conto (da implementare).
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer fisso del modale */}
        <DialogFooter className="p-6 pt-0 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="outline">ANNULLA</Button>
          </DialogClose>
          <Button onClick={handlePrint}>STAMPA</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
