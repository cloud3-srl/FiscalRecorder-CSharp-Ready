import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product } from "@shared/schema"; // Se necessario per gli articoli
import { 
  CreditCard, Landmark, Ticket, Gift, Wallet, CalendarOff, 
  University, TrendingUp, TrendingDown, Contact, Building, FileText, Minus, Plus 
} from "lucide-react"; // Alcune icone esempio

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  cartItems: Array<{product: Product, quantity: number}>; // Per eventuale stampa
  onPaymentComplete: (paymentDetails: any) => void; // Dettagli del pagamento
}

// Esempio di metodi di pagamento
const paymentMethods = [
  { name: "CONTANTI", icon: Wallet, amountField: true },
  { name: "BANCOMAT", icon: CreditCard },
  { name: "CARTA DI CREDITO", icon: CreditCard },
  { name: "ASSEGNO", icon: FileText },
  { name: "TICKET", icon: Ticket },
  { name: "BUONO PER SERVIZI", icon: Gift },
  { name: "BUONO PER BENI", icon: Gift },
  { name: "PREPAGATA", icon: CreditCard },
  { name: "TS WALLET", icon: Wallet }, // Icona da rivedere se specifica
  { name: "DIFFERITO", icon: CalendarOff },
  { name: "BONIFICO BANCARIO", icon: Landmark },
  { name: "RIBA 30", icon: TrendingUp }, // Icona esempio
  { name: "RIBA 60", icon: TrendingDown }, // Icona esempio
  { name: "POSTE PAY", icon: CreditCard }, // Icona esempio
  { name: "PAYPAL", icon: Wallet }, // Icona esempio
];

export default function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  // cartItems, // Non usato per ora
  onPaymentComplete,
}: PaymentModalProps) {
  // Stati per gli importi pagati, resto, etc.
  // const [paidAmount, setPaidAmount] = useState(0);
  // const [cashPaid, setCashPaid] = useState(0);
  const rest = 0; // Da calcolare: totalAmount - paidAmount

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
                {paymentMethods.map((method) => (
                  <Button key={method.name} variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                    <method.icon className="h-6 w-6 mb-1" />
                    <span className="text-xs leading-tight">{method.name}</span>
                    {method.amountField && <span className="text-blue-600 font-semibold text-sm mt-1">€0,00</span>}
                  </Button>
                ))}
              </div>
            </ScrollArea>
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
                <div>
                  <Label htmlFor="company">Azienda</Label>
                  <div className="flex items-center gap-2">
                    <Input id="company" placeholder="Seleziona azienda..." />
                    <Button variant="outline" size="icon"><Building className="h-4 w-4" /></Button>
                  </div>
                </div>
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
