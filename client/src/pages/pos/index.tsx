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
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import CustomerSelect from "./components/CustomerSelect";
import { Product } from "@shared/schema";
import { Calendar, Store, Pause, ShoppingCart, CreditCard, Users } from "lucide-react";

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [registrationMode, setRegistrationMode] = useState<string>("SCONTRINO DI VENDITA");
  const [table, setTable] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("products"); // Nuovo stato per gestire le tab

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
        <div className="flex mb-4 bg-white rounded-lg shadow-sm p-1 border">
          <Button 
            variant="ghost" 
            className={`flex-1 rounded-md ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Prodotti
          </Button>
          <Button 
            variant="ghost" 
            className={`flex-1 rounded-md ${activeTab === 'customers' ? 'bg-blue-50 text-blue-600' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users className="h-4 w-4 mr-2" />
            Clienti
          </Button>
          <Button 
            variant="ghost" 
            className={`flex-1 rounded-md ${activeTab === 'payment' ? 'bg-blue-50 text-blue-600' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamento
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Products and Cart */}
          <div className="col-span-5 space-y-4">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden">
              <div className="mb-4">
                <CustomerSelect
                  selectedCustomerId={selectedCustomerId}
                  onSelect={setSelectedCustomerId}
                />
              </div>
              <ProductGrid onProductSelect={(product) => addToCart(product)} />
            </Card>
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden">
              <Cart items={cart} setItems={setCart} />
            </Card>
          </div>

          {/* Center Column - Quick Buttons */}
          <div className="col-span-4">
            <Card className="p-4 shadow-sm border border-gray-100 rounded-lg overflow-hidden h-full">
              <QuickButtons onProductSelect={(product) => addToCart(product)} />
            </Card>
          </div>

          {/* Right Column - Payment */}
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
