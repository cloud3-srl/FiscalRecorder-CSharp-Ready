import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import { Product } from "@shared/schema";
import { Trash2, Save, PlusCircle, UserSearch, Store } from "lucide-react";
import NewNumericKeypad from "./components/NewNumericKeypad";
import PaymentModal from "./components/PaymentModal"; // Importa il nuovo modale

const categoryTabs = [
  { value: "preferiti", label: "Preferiti" },
  { value: "reparti", label: "Reparti" },
  { value: "cat1", label: "Categoria Pers. 1" },
  { value: "cat2", label: "Categoria Pers. 2" },
  { value: "cat3", label: "Categoria Pers. 3" },
  { value: "cat4", label: "Categoria Pers. 4" },
];

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(categoryTabs[0].value);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [displayValue, setDisplayValue] = useState("0.00");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
  };

  const currentTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleNumericKeyPress = (key: string) => {
    // console.log("Key pressed on NewNumericKeypad:", key); // Rimuovo DEBUG
    if (key === "C") {
      setDisplayValue("0.00");
    } else if (key === "PAGA") {
      // console.log("Apertura modale pagamento con importo:", displayValue, "e totale carrello:", currentTotal); // Rimuovo DEBUG
      // Qui potremmo passare displayValue o currentTotal al modale, a seconda della logica desiderata
      setIsPaymentModalOpen(true);
    } else {
      // Semplice concatenazione per ora, da migliorare
      setDisplayValue(prev => (prev === "0.00" ? key : prev + key));
    }
  };

  const handlePaymentComplete = (paymentDetails: any) => {
    console.log("Pagamento completato:", paymentDetails);
    // Qui logica per salvare la vendita, svuotare il carrello, ecc.
    setCart([]); // Svuota il carrello dopo il pagamento
    setDisplayValue("0.00"); // Resetta il display del tastierino
  };

  return (
    // Rimuovo min-h-screen bg-gray-50 dal wrapper esterno, sarà gestito dal layout principale
    // e dal container interno se necessario.
    // Il padding p-4 md:p-8 pt-6 è già in App.tsx <main>
    // Quindi il container qui non ha bisogno di px-4 e può usare h-full.
    <div className="h-full flex flex-col"> {/* Modificato per occupare lo spazio del genitore <main> */}
      {/* Top Bar rimossa */}

      {/* Il container principale della pagina POS ora occupa h-full del suo genitore <main> */}
      {/* Rimuovo container mx-auto px-4 perché il padding è già gestito da <main> in App.tsx */}
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-12 gap-4 mt-0 flex-grow h-full"> {/* Aggiunto h-full qui */}
          <div className="col-span-8 h-full"> {/* Left Column */}
            <Card className="px-2 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full flex flex-col pb-2"> 
              <ProductGrid 
                onProductSelect={(product) => addToCart(product)} 
                onSearchChange={setSearchTerm}
              />
              {!searchTerm && (
                <Tabs value={activeCategoryTab} onValueChange={setActiveCategoryTab} className="mt-2 flex-grow flex flex-col overflow-hidden">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 shrink-0">
                    {categoryTabs.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  {categoryTabs.map(tab => (
                    <TabsContent 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex-grow flex flex-col overflow-hidden pt-2"
                    >
                      <div className="flex-grow overflow-y-auto p-1">
                        {/* Area per prodotti filtrati, vuota per ora */}
                      </div>
                      {tab.value === "preferiti" && (
                        <div className="pt-2 border-t mt-1 shrink-0">
                          <QuickButtons onProductSelect={(product) => addToCart(product)} />
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </Card>
          </div>

          <div className="col-span-4 space-y-2 flex flex-col h-full"> {/* Right Column */}
            <Card className="p-2 shadow-sm border border-gray-100 rounded-lg">
              <div className="flex justify-around items-center">
                <Button variant="ghost" size="icon" title="Svuota Carrello" onClick={() => setCart([])}>
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Salva Conto">
                  <Save className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Nuovo Conto">
                  <PlusCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Richiama Cliente">
                  <UserSearch className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Info Negozio/Azienda">
                  <Store className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden flex-grow">
              <Cart items={cart} setItems={setCart} />
            </Card>
            
            <Card className="p-2 shadow-sm border border-gray-100 rounded-lg">
              <NewNumericKeypad onKeyPress={handleNumericKeyPress} /> {/* Ripristino NewNumericKeypad */}
            </Card>
          </div>
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        totalAmount={currentTotal} // Passa il totale corrente del carrello
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
