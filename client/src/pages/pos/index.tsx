import { useState } from "react";
import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button"; // Rimosso se non usato
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"; // Rimosso se non usato
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
// import Payment from "./components/Payment"; // Rimosso
// import CustomerSelect from "./components/CustomerSelect"; // Rimosso
import { Product } from "@shared/schema";
// import { Calendar, Pause } from "lucide-react"; // Rimosso se non usato

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
  // const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null); // Rimosso
  // const [registrationMode, setRegistrationMode] = useState<string>("SCONTRINO DI VENDITA"); // Rimosso
  // const [table, setTable] = useState<string>(""); // Rimosso
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(categoryTabs[1].value); // Modificato qui
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Semplificata */}
      <div className="bg-white shadow-sm border-b p-3">
        <div className="container mx-auto flex justify-end items-center h-10"> {/* Aggiunto h-10 per dare altezza minima */}
          {/* Contenuto futuro per pulsanti in alto a destra */}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Cart Only */}
          <div className="col-span-4 space-y-4">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full">
              <Cart items={cart} setItems={setCart} />
            </Card>
          </div>

          {/* Center Column - Search, Category Tabs, and Product Display Area */}
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
          {/* Right Column (Payment) rimossa */}
        </div>
      </div>
    </div>
  );
}
