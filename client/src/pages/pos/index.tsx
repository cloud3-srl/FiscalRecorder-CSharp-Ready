import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Aggiungo Button per i nuovi pulsanti
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import { Product } from "@shared/schema";
import { Trash2, Save, PlusCircle, UserSearch, Store } from "lucide-react"; // Nuove icone
import NewNumericKeypad from "./components/NewNumericKeypad"; // Assumo esista per il tastierino

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
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(categoryTabs[0].value); // Ripristino preferiti come default
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Stati per il nuovo tastierino e display pagamento (semplificati per ora)
  const [displayValue, setDisplayValue] = useState("0.00");


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

  const handleNumericKeyPress = (key: string) => {
    // Logica base per il tastierino, da espandere
    if (key === "C") {
      setDisplayValue("0.00");
    } else if (key === "PAGA") {
      // Apri modale pagamento (Fase 4)
      console.log("Apri modale pagamento con importo:", displayValue);
    } else {
      // Semplice concatenazione per ora
      setDisplayValue(prev => (prev === "0.00" ? key : prev + key));
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Semplificata */}
      <div className="bg-white shadow-sm border-b p-3">
        <div className="container mx-auto flex justify-end items-center h-10">
          {/* Qui andranno i pulsanti "Svuota lista", "Salva conto", ecc. ma li metto nella colonna destra come da screenshot */}
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content */}
      {/* Aggiungo flex flex-col h-[calc(100vh-theme(spacing.20))] per far sì che il container occupi l'altezza rimanente */}
      <div className="container mx-auto px-4 flex flex-col h-[calc(100vh-theme(spacing.20))]"> {/* h-20 è circa l'altezza della topbar (h-10 + p-3*2) */}
        <div className="grid grid-cols-12 gap-4 mt-0 flex-grow"> {/* Aggiunto flex-grow per far espandere la griglia */}
          {/* Left Column - Search, Category Tabs, and Product Display Area (2/3) */}
          <div className="col-span-8 h-full"> {/* Aggiunto h-full */}
            {/* Rimosso padding verticale dalla Card, aggiunto pb-2 per un minimo spazio sotto */}
            <Card className="px-2 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full flex flex-col pb-2"> 
              <ProductGrid 
                onProductSelect={(product) => addToCart(product)} 
                onSearchChange={setSearchTerm}
              />
              
              {!searchTerm && (
                <Tabs value={activeCategoryTab} onValueChange={setActiveCategoryTab} className="mt-2 flex-grow flex flex-col overflow-hidden"> {/* Aggiunto overflow-hidden a Tabs */}
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 shrink-0"> {/* Aggiunto shrink-0 a TabsList */}
                    {categoryTabs.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  {categoryTabs.map(tab => (
                    <TabsContent 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex-grow flex flex-col overflow-hidden pt-2" // Modificato per flex container
                    >
                      <div className="flex-grow overflow-y-auto p-1"> {/* Area scrollabile per prodotti filtrati */}
                        {/* Testo placeholder rimosso. Quest'area mostrerà i prodotti o sarà vuota. */}
                        {/* Si potrebbe aggiungere un messaggio "Nessun prodotto in questa categoria" se l'array dei prodotti è vuoto */}
                      </div>
                      {/* Tasti personalizzabili / QuickButtons fissi in basso per la tab "preferiti" */}
                      {tab.value === "preferiti" && (
                        <div className="pt-2 border-t mt-1 shrink-0"> {/* Aggiunto shrink-0 */}
                          <QuickButtons onProductSelect={(product) => addToCart(product)} />
                        </div>
                      )}
                       {/* Per le altre tab, se non hanno una sezione fissa in basso, questo div non ci sarà */}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </Card>
          </div>

          {/* Right Column - Actions, Cart, Keypad (1/3) */}
          <div className="col-span-4 space-y-2 flex flex-col h-full"> {/* Aggiunto h-full e modificato space-y-4 a space-y-2 */}
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
              {/* Display rimosso */}
              <NewNumericKeypad onKeyPress={handleNumericKeyPress} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
