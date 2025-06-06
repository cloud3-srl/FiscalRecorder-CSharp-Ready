import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import CustomerSearchModal from "./components/CustomerSearchModal";
import { Product, Customer } from "@shared/schema";
import { Trash2, Save, PlusCircle, UserSearch, Store, RotateCcw } from "lucide-react";
import NewNumericKeypad from "./components/NewNumericKeypad";
import PaymentModal from "./components/PaymentModal";
import { useAudio } from "@/hooks/use-audio";
import "@/styles/pos.css";

// Interfaccia per i conti salvati
interface SavedAccount {
  id: string;
  name: string;
  items: Array<{product: Product, quantity: number}>;
  customer?: Customer;
  total: number;
  savedAt: Date;
}

export default function POS() {
  // Stati esistenti
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [displayValue, setDisplayValue] = useState("0.00");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Nuovi stati per le funzionalità dei bottoni
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Stati per i modali
  const [isSaveAccountModalOpen, setIsSaveAccountModalOpen] = useState(false);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [accountNameToSave, setAccountNameToSave] = useState("");

  // Hook per audio
  const { playBeep } = useAudio();

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
    
    // Riproduci il beep quando viene aggiunto un prodotto
    playBeep();
  };

  const currentTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleNumericKeyPress = (key: string) => {
    if (key === "C") {
      setDisplayValue("0.00");
    } else if (key === "PAGA") {
      setIsPaymentModalOpen(true);
    } else {
      setDisplayValue(prev => (prev === "0.00" ? key : prev + key));
    }
  };

  const handlePaymentComplete = (paymentDetails: any) => {
    console.log("Pagamento completato:", paymentDetails);
    setCart([]);
    setSelectedCustomer(null);
    setDisplayValue("0.00");
  };

  // Funzione per salvare il conto corrente
  const handleSaveAccount = () => {
    if (cart.length === 0) {
      alert("Non ci sono articoli nel carrello da salvare");
      return;
    }
    setIsSaveAccountModalOpen(true);
  };

  const confirmSaveAccount = () => {
    if (accountNameToSave.trim() === "") {
      alert("Inserisci un nome per il conto");
      return;
    }

    const newAccount: SavedAccount = {
      id: Date.now().toString(),
      name: accountNameToSave.trim(),
      items: [...cart],
      customer: selectedCustomer || undefined,
      total: currentTotal,
      savedAt: new Date()
    };

    setSavedAccounts(prev => [...prev, newAccount]);
    setIsSaveAccountModalOpen(false);
    setAccountNameToSave("");
    
    // Pulisci il carrello dopo aver salvato
    setCart([]);
    setSelectedCustomer(null);
    setDisplayValue("0.00");
  };

  // Funzione per pulire il carrello (bottone +)
  const handleClearCart = () => {
    if (cart.length === 0) {
      // Se il carrello è già vuoto, non fare nulla o mostra un messaggio
      return;
    }
    // Se ci sono articoli, chiedi conferma
    setIsClearConfirmModalOpen(true);
  };

  const confirmClearCart = (saveFirst: boolean) => {
    if (saveFirst) {
      // Salva prima di pulire
      setIsClearConfirmModalOpen(false);
      setIsSaveAccountModalOpen(true);
      return;
    }
    
    // Pulisci senza salvare
    setCart([]);
    setSelectedCustomer(null);
    setDisplayValue("0.00");
    setIsClearConfirmModalOpen(false);
  };

  // Funzione per associare un cliente
  const handleSelectCustomer = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-12 gap-6 flex-grow h-full">
          <div className="col-span-8 h-full flex flex-col">
            {/* Margine top per il campo di ricerca */}
            <div className="mt-8"></div>
            
            <Card className="px-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden flex-1 flex flex-col"> 
              <ProductGrid 
                onProductSelect={(product) => addToCart(product)} 
                onSearchChange={setSearchTerm}
              />
              
              {/* Spazio bianco tra ricerca e bottoni */}
              <div className="flex-1"></div>
              
              {!searchTerm && (
                <div className="mt-6 pb-4">
                  <QuickButtons onProductSelect={(product) => addToCart(product)} />
                </div>
              )}
            </Card>
          </div>

          <div className="col-span-4 flex flex-col h-full">
            {/* Margine top allineato con la colonna sinistra */}
            <div className="mt-8"></div>
            
            {/* Mostra cliente selezionato */}
            {selectedCustomer && (
              <Card className="p-4 mb-4 shadow-sm border border-green-200 bg-green-50 rounded-lg">
                <div className="text-base">
                  <div className="font-medium text-green-800">Cliente: {selectedCustomer.name}</div>
                  <div className="text-green-600 text-sm">
                    {selectedCustomer.code} • {selectedCustomer.vatNumber || selectedCustomer.fiscalCode || 'N/D'}
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5 shadow-sm border border-gray-100 rounded-lg overflow-hidden flex-1 flex flex-col">
              <Cart items={cart} setItems={setCart} />
            </Card>
            
            {/* Bottoni rapidi sopra il tastierino */}
            <div className="mt-4 mb-3">
              <div className="flex justify-center gap-3">
                <div className="quick-action-btn" onClick={handleClearCart}>
                  <Trash2 className="h-6 w-6 text-gray-600" />
                  <div className="tooltip">Svuota Carrello</div>
                </div>
                <div className="quick-action-btn" onClick={handleSaveAccount}>
                  <Save className="h-6 w-6 text-gray-600" />
                  <div className="tooltip">Salva Conto</div>
                </div>
                <div className="quick-action-btn" onClick={handleClearCart}>
                  <RotateCcw className="h-6 w-6 text-gray-600" />
                  <div className="tooltip">Reset</div>
                </div>
                <div className="quick-action-btn" onClick={handleSelectCustomer}>
                  <UserSearch className="h-6 w-6 text-gray-600" />
                  <div className="tooltip">Cliente</div>
                </div>
                <div className="quick-action-btn">
                  <Store className="h-6 w-6 text-gray-600" />
                  <div className="tooltip">Negozio</div>
                </div>
              </div>
            </div>
            
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg">
              <NewNumericKeypad onKeyPress={handleNumericKeyPress} />
            </Card>
          </div>
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        totalAmount={currentTotal}
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
        selectedCustomer={selectedCustomer}
      />

      {/* Modal per Salvare il Conto */}
      <Dialog open={isSaveAccountModalOpen} onOpenChange={setIsSaveAccountModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Salva Conto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-name" className="text-right">
                Nome Conto
              </Label>
              <Input
                id="account-name"
                value={accountNameToSave}
                onChange={(e) => setAccountNameToSave(e.target.value)}
                className="col-span-3"
                placeholder="Es. Tavolo 5, Cliente Mario..."
                autoFocus
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <div>Articoli: {cart.length}</div>
              <div>Totale: €{currentTotal.toFixed(2)}</div>
              {selectedCustomer && (
                <div>Cliente: {selectedCustomer.name}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveAccountModalOpen(false);
                setAccountNameToSave("");
              }}
            >
              Annulla
            </Button>
            <Button onClick={confirmSaveAccount}>
              Salva Conto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal di Conferma per Pulire il Carrello */}
      <Dialog open={isClearConfirmModalOpen} onOpenChange={setIsClearConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pulisci Carrello
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Ci sono {cart.length} articoli nel carrello. Cosa vuoi fare?
            </p>
            <div className="text-sm">
              <div>Totale corrente: €{currentTotal.toFixed(2)}</div>
              {selectedCustomer && (
                <div>Cliente: {selectedCustomer.name}</div>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsClearConfirmModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              variant="outline"
              onClick={() => confirmClearCart(true)}
            >
              Salva e Pulisci
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmClearCart(false)}
            >
              Pulisci Senza Salvare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal per Selezionare Cliente */}
      <CustomerSearchModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onCustomerSelect={handleCustomerSelected}
      />
    </div>
  );
}
