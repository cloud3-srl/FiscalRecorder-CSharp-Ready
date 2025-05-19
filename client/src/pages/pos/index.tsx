import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Nuova importazione
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons"; // Potrebbe essere rimosso o modificato
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import CustomerSelect from "./components/CustomerSelect";
import { Product } from "@shared/schema";
import { Calendar, Store, Pause, ShoppingCart, CreditCard, Users } from "lucide-react"; // Store non è usato

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [registrationMode, setRegistrationMode] = useState<string>("SCONTRINO DI VENDITA");
  const [table, setTable] = useState<string>("");
  // const [activeTab, setActiveTab] = useState<string>("products"); // Rimosso, useremo activeCategoryTab
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(categoryTabs[0].value);
  const [searchTerm, setSearchTerm] = useState<string>(""); // Per gestire la ricerca da ProductGrid

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
      {/* Top Bar - Stile WowDash */}
      <div className="bg-white shadow-sm border-b p-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <Select value={registrationMode} onValueChange={setRegistrationMode}>
                <SelectTrigger className="w-[220px] border-0 bg-transparent focus:ring-0">
                  <SelectValue>{registrationMode}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCONTRINO DI VENDITA">SCONTRINO DI VENDITA</SelectItem>
                  <SelectItem value="PREVENTIVO">PREVENTIVO</SelectItem>
                  <SelectItem value="FATTURA">FATTURA</SelectItem>
                  <SelectItem value="RESO">RESO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-2 rounded-md">
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger className="w-[120px] border-0 bg-transparent focus:ring-0">
                  <SelectValue placeholder="Tavolo">Tavolo</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tavolo 1</SelectItem>
                  <SelectItem value="2">Tavolo 2</SelectItem>
                  <SelectItem value="DELIVERY">DELIVERY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-blue-50 border-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              VENDITE DEL GIORNO
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-amber-50 border-0 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
            >
              <Pause className="h-4 w-4 mr-2" />
              SOSPESO
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Stile WowDash */}
      <div className="container mx-auto p-4">
        {/* Tabs di navigazione in stile WowDash */}
        {/* Rimosse le tab di navigazione principali (Prodotti, Clienti, Pagamento) da qui, 
            saranno integrate diversamente o gestite dalla sidebar principale dell'app */}

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Customer Select and Cart */}
          {/* Modificato da col-span-5 a col-span-4 (o 3, da decidere) */}
          <div className="col-span-4 space-y-4">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden">
              <CustomerSelect
                selectedCustomerId={selectedCustomerId}
                onSelect={setSelectedCustomerId}
              />
            </Card>
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden">
              <Cart items={cart} setItems={setCart} />
            </Card>
          </div>

          {/* Center Column - Search, Category Tabs, and Product Display Area */}
          {/* Modificato da col-span-4 a col-span-5 (o 6) */}
          <div className="col-span-5">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full">
              <ProductGrid 
                onProductSelect={(product) => addToCart(product)} 
                onSearchChange={setSearchTerm} // Passa la callback per aggiornare lo stato di ricerca
              />
              
              {/* Mostra le tab solo se non c'è una ricerca attiva */}
              {!searchTerm && (
                <Tabs value={activeCategoryTab} onValueChange={setActiveCategoryTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                    {categoryTabs.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  {categoryTabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value}>
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
              {/* Se searchTerm è attivo, ProductGrid gestirà la visualizzazione dei risultati o "Nessun prodotto trovato".
                  Non è necessario un ulteriore placeholder qui per il caso di ricerca. */}
            </Card>
          </div>

          {/* Right Column - Payment */}
          {/* Modificato da col-span-3 a col-span-3 (o 4) */}
          <div className="col-span-3 space-y-4">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden">
              <Payment 
                cart={cart} 
                customerId={selectedCustomerId}
                onComplete={() => {
                  setCart([]);
                  setSelectedCustomerId(null);
                }} 
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
