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
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Search, Category Tabs, and Product Display Area (2/3) */}
          <div className="col-span-8">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full flex flex-col">
              <ProductGrid 
                onProductSelect={(product) => addToCart(product)} 
                onSearchChange={setSearchTerm}
              />
              
              {!searchTerm && (
                <Tabs value={activeCategoryTab} onValueChange={setActiveCategoryTab} className="mt-4 flex-grow flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                    {categoryTabs.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  {categoryTabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="flex-grow">
                      {tab.value === "preferiti" ? (
                        <QuickButtons onProductSelect={(product) => addToCart(product)} />
                      ) : (
                        <div className="py-4 text-center text-muted-foreground h-full flex items-center justify-center">
                          Contenuto per {tab.label} non ancora implementato.
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </Card>
          </div>

          {/* Right Column - Actions, Cart, Keypad (1/3) */}
          <div className="col-span-4 space-y-4 flex flex-col">
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
              {/* Placeholder per il display del tastierino */}
              <div className="text-right text-2xl font-mono p-2 mb-2 border-b h-12 flex items-center justify-end">{displayValue}</div>
              <NewNumericKeypad onKeyPress={handleNumericKeyPress} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
